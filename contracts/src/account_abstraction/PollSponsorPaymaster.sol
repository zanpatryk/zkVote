// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// forge install eth-infinitism/account-abstraction

import {BasePaymaster} from "@account-abstraction/contracts/core/BasePaymaster.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {IPollManager} from "../interfaces/IPollManager.sol";
import {VotingSystemEngine} from "../core/VotingSystemEngine.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

//errors
error PollSponsorPaymaster__PollDoesNotExist(uint256 pollId);
error PollSponsorPaymaster__Unauthorized();
error PollSponsorPaymaster__ZeroValueNotAllowed();
error PollSponsorPaymaster__NotEnoughBudget();
error PollSponsorPaymaster__PaymasterDataMalformed();
error PollSponsorPaymaster__PaymasterCallDataMalformed();
error PollSponsorPaymaster__OnlyExecuteSelector();
error PollSponsorPaymaster__PaymasterInnerCallDataMalformed();
error PollSponsorPaymaster__OnlyCastVoteSelector();

contract PollSponsorPaymaster is BasePaymaster {
    IPollManager public immutable i_pollManager;
    VotingSystemEngine public immutable i_votingSystemEngine;

    mapping(uint256 pollId => uint256 weiAmountSponsored) public s_pollBudgets;
    mapping(uint256 pollId => mapping(address voter => uint256 weiSpent)) public s_voterSpentPerPoll;
    mapping(uint256 pollId => uint256 weiLimit) public s_perVoterWeiLimit; // 0 means no limit

    // events
    event PollFunded(uint256 indexed pollId, address indexed owner, uint256 amount);
    event PollDebited(uint256 indexed pollId, address indexed sender, uint256 amount);
    event PerVoterLimitSet(uint256 indexed pollId, uint256 weiLimit);

    // execute selector for SimpleAccount
    bytes4 private constant EXECUTE_SELECTOR = bytes4(keccak256("execute(address,uint256,bytes)"));

    // selector for VotingSystemEngine.castVote
    bytes4 private constant CAST_VOTE_SELECTOR = bytes4(keccak256("castVote(uint256,uint256)"));

    constructor(IEntryPoint _entryPoint, address _pollManager, address _votingSystemEngine)
        BasePaymaster(_entryPoint, msg.sender)
    {
        i_pollManager = IPollManager(_pollManager);
        i_votingSystemEngine = VotingSystemEngine(_votingSystemEngine);
    }

    /// @notice Allows poll owner to fund their poll
    function fundPoll(uint256 pollId) external payable {
        address pollOwner = i_pollManager.getPollOwner(pollId);
        if (pollOwner == address(0)) {
            revert PollSponsorPaymaster__PollDoesNotExist(pollId);
        }
        if (msg.sender != pollOwner) {
            // only the poll owner can fund the poll
            revert PollSponsorPaymaster__Unauthorized();
        }
        if (msg.value == 0) {
            revert PollSponsorPaymaster__ZeroValueNotAllowed();
        }

        deposit();
        s_pollBudgets[pollId] += msg.value;
        emit PollFunded(pollId, msg.sender, msg.value);
    }

    /// @notice Allows poll owner to withdraw leftover funds (calls EntryPoint.withdrawTo).
    /// @param pollId poll id
    /// @param to recipient address
    /// @param amount amount in wei to withdraw (<= remaining budget)
    function withdrawPoll(uint256 pollId, address payable to, uint256 amount) external {
        address pollOwner = i_pollManager.getPollOwner(pollId);
        if (pollOwner == address(0)) {
            revert PollSponsorPaymaster__PollDoesNotExist(pollId);
        }
        if (msg.sender != pollOwner) {
            // only the poll owner can withdraw from the poll
            revert PollSponsorPaymaster__Unauthorized();
        }

        uint256 availableBudget = s_pollBudgets[pollId];
        if (availableBudget == 0) {
            revert PollSponsorPaymaster__NotEnoughBudget();
        }

        uint256 withdrawAmount = amount == 0 ? availableBudget : amount;
        if (withdrawAmount > availableBudget) {
            withdrawAmount = availableBudget;
        }

        s_pollBudgets[pollId] = availableBudget - withdrawAmount;

        withdrawTo(to, withdrawAmount);
    }

    // Set per-voter limit for a poll ( owner only
    function setPerVoterLimit(uint256 pollId, uint256 weiLimit) external {
        address pollOwner = i_pollManager.getPollOwner(pollId);
        if (pollOwner == address(0)) {
            revert PollSponsorPaymaster__PollDoesNotExist(pollId);
        }
        if (msg.sender != pollOwner) {
            // only the poll owner can withdraw from the poll
            revert PollSponsorPaymaster__Unauthorized();
        }
        s_perVoterWeiLimit[pollId] = weiLimit;
        emit PerVoterLimitSet(pollId, weiLimit);
    }

    // Paymaster hooks ( BasePaymaster overrides )
    /**
     * @dev Validate that:
     *  - paymasterAndData encodes a pollId
     *  - Poll exists
     *  - userOp.callData is SimpleAccount.execute(target,value,data) and target == votingEngine
     *  - the inner call is castVote(...) (plain vote)
     *  - sender is whitelisted for this poll (via votingEngine.isWhitelisted)
     *  - pollBudget >= maxCost (conservative pre-check)
     *  - per-voter limit (if set) is not exceeded
     *
     * Returns `context = abi.encode(pollId, sender)` for use in _postOp
     */

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32,
        /*userOpHash*/
        uint256 maxCost
    )
        internal
        override
        returns (bytes memory context, uint256 validationData)
    {
        bytes calldata pmad = userOp.paymasterAndData;
        if (pmad.length < 20 + 16 + 16 + 32) {
            revert PollSponsorPaymaster__PaymasterDataMalformed();
        }

        uint256 pollId = uint256(bytes32(pmad[52:84]));

        bytes calldata callData = userOp.callData;
        if (callData.length < 4) {
            revert PollSponsorPaymaster__PaymasterCallDataMalformed();
        }
        bytes4 selector = bytes4(userOp.callData[:4]);
        if (selector != EXECUTE_SELECTOR) {
            revert PollSponsorPaymaster__OnlyExecuteSelector();
        }

        address target = address(uint160(uint256(bytes32(userOp.callData[4:36]))));

        if (target != address(i_votingSystemEngine)) {
            revert PollSponsorPaymaster__Unauthorized();
        }

        if (userOp.callData.length < 136) revert PollSponsorPaymaster__PaymasterInnerCallDataMalformed();

        bytes4 innerSelector = bytes4(userOp.callData[132:136]);
        if (innerSelector != CAST_VOTE_SELECTOR) {
            revert PollSponsorPaymaster__OnlyCastVoteSelector();
        }

        address sender = userOp.sender;

        if (s_pollBudgets[pollId] < maxCost) {
            revert PollSponsorPaymaster__NotEnoughBudget();
        }

        uint256 perVoterLimit = s_perVoterWeiLimit[pollId];
        if (perVoterLimit != 0) {
            uint256 spentSoFar = s_voterSpentPerPoll[pollId][sender];
            if (spentSoFar + maxCost > perVoterLimit) {
                revert PollSponsorPaymaster__NotEnoughBudget();
            }
        }

        return (abi.encode(pollId, userOp.sender), 0);
    }

    /**
     * @dev Called after the operation executes. EntryPoint provides the actualGasCost (wei),
     * which the paymaster should account for. We debit pollBudget and increase pollVoterSpent.
     */
    function _postOp(
        PostOpMode,
        /*mode*/
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /*actualUserOpFeePerGas*/
    )
        internal
        override
    {
        (uint256 pollId, address sender) = abi.decode(context, (uint256, address));

        uint256 toCharge = actualGasCost;

        uint256 currentBudget = s_pollBudgets[pollId];
        if (toCharge >= currentBudget) {
            s_pollBudgets[pollId] = 0;
        } else {
            s_pollBudgets[pollId] = currentBudget - toCharge;
        }

        s_voterSpentPerPoll[pollId][sender] += toCharge;

        emit PollDebited(pollId, sender, toCharge);
    }

    receive() external payable {}
}
