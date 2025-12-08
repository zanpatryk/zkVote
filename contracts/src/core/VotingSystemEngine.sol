// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPollManager} from "../interfaces/IPollManager.sol";
import {IEligibilityModule} from "../interfaces/IEligibilityModule.sol";
import {IVoteStorage} from "../interfaces/IVoteStorage.sol";

/* Errors */
error VotingSystem__NotOwner();
error VotingSystem__AlreadyInitialized();
error VotingSystem__InvalidAddress();
error VotingSystem__EmptyTitle();
error VotingSystem__InvalidNumberOfOptions();
error VotingSystem__AddressNotWhitelisted(address user);
error VotingSystem__InvalidPollId();
error VotingSystem__InvalidOption();
error VotingSystem__InvalidPollState();
error VotingSystem__NotPollOwner();

/**
 * @title Voting System
 * @dev This contract is the main contract for the voting system.
 * It is the entry point for all voting related operations.
 */
contract VotingSystemEngine {
    /* State variables */
    address public immutable i_owner;
    IPollManager public s_pollManager;
    IEligibilityModule public s_eligibilityModule;
    IVoteStorage public s_voteStorage;
    bool public s_initializationFlag;

    /* Events */
    /* ... */

    /* Modifiers */
    modifier ownerOnly() {
        if (msg.sender != i_owner) {
            revert VotingSystem__NotOwner();
        }
        _;
    }

    modifier checkPollValidity(uint256 pollId) {
        if (!s_pollManager.isValidPollId(pollId)) {
            revert VotingSystem__InvalidPollId();
        }
        _;
    }

    modifier onlyWhenInState(uint256 pollId, uint8 requiredState) {
        uint8 currentState = s_pollManager.getState(pollId);
        if (currentState != requiredState) {
            revert VotingSystem__InvalidPollState();
        }
        _;
    }

    /* Functions */
    constructor() {
        i_owner = msg.sender;
    }

    function initialize(address pollManager, address eligibilityModule, address voteStorage) external ownerOnly {
        if (s_initializationFlag) {
            revert VotingSystem__AlreadyInitialized();
        }
        if (pollManager == address(0) || eligibilityModule == address(0) || voteStorage == address(0)) {
            revert VotingSystem__InvalidAddress();
        }
        s_pollManager = IPollManager(pollManager);
        s_eligibilityModule = IEligibilityModule(eligibilityModule);
        s_voteStorage = IVoteStorage(voteStorage);
        s_initializationFlag = true;
    }

    function createPoll(string calldata title, string calldata description, string[] calldata options)
        external
        returns (uint256 pollId)
    {
        if (bytes(title).length == 0) {
            revert VotingSystem__EmptyTitle();
        }

        if (options.length < 2) {
            revert VotingSystem__InvalidNumberOfOptions();
        }

        pollId = s_pollManager.createPoll(title, description, options, msg.sender);

        return pollId;
    }

    function whitelistUser(uint256 pollId, address user) external checkPollValidity(pollId) onlyWhenInState(pollId, 1) {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_eligibilityModule.addWhitelisted(pollId, user);
    }

    function whitelistUsers(uint256 pollId, address[] calldata users)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
    {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_eligibilityModule.addWhitelistedBatch(pollId, users);
    }

    function removeWhitelisted(uint256 pollId, address user)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
    {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_eligibilityModule.removeWhitelisted(pollId, user);
    }

    function isWhitelisted(uint256 pollId, address user) external view checkPollValidity(pollId) returns (bool) {
        return s_eligibilityModule.isWhitelisted(pollId, user);
    }

    function castVote(uint256 pollId, uint256 optionIdx)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
        returns (uint256 voteId)
    {
        address voter = msg.sender;
        if (!s_eligibilityModule.isWhitelisted(pollId, voter)) {
            revert VotingSystem__AddressNotWhitelisted(voter);
        }

        uint256 optionCount = s_pollManager.getPollOptionCount(pollId);
        if (optionIdx >= optionCount) {
            revert VotingSystem__InvalidOption();
        }

        voteId = s_voteStorage.castVote(pollId, voter, abi.encode(optionIdx));
    }

    function startPoll(uint256 pollId) external checkPollValidity(pollId) onlyWhenInState(pollId, 0) {
        address owner = s_pollManager.getPollOwner(pollId);
        if (msg.sender != owner) revert VotingSystem__NotPollOwner();
        s_pollManager.setState(pollId, 1); // Set state to ACTIVE
    }

    function endPoll(uint256 pollId) external checkPollValidity(pollId) onlyWhenInState(pollId, 1) {
        address owner = s_pollManager.getPollOwner(pollId);
        if (msg.sender != owner) revert VotingSystem__NotPollOwner();
        s_pollManager.setState(pollId, 2); // Set state to ENDED
    }
}
