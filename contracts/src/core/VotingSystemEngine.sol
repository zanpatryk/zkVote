// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPollManager} from "../interfaces/IPollManager.sol";
import {IEligibilityModule} from "../interfaces/IEligibilityModule.sol";
import {ISemaphoreEligibilityModule} from "../interfaces/ISemaphoreEligibilityModule.sol";
import {IVoteStorage} from "../interfaces/IVoteStorage.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {ResultNFT} from "../result_nft/ResultNFT.sol";

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
error VotingSystem__NotAuthorizedToMint();
error VotingSystem__NFTContractNotSet();

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
    address public s_resultNFT;
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

    function initialize(address pollManager, address eligibilityModule, address voteStorage, address resultNFTAddress)
        external
        ownerOnly
    {
        if (s_initializationFlag) {
            revert VotingSystem__AlreadyInitialized();
        }
        if (pollManager == address(0) || eligibilityModule == address(0) || voteStorage == address(0)) {
            revert VotingSystem__InvalidAddress();
        }
        s_pollManager = IPollManager(pollManager);
        s_eligibilityModule = IEligibilityModule(eligibilityModule);
        s_voteStorage = IVoteStorage(voteStorage);
        s_resultNFT = resultNFTAddress;
        s_initializationFlag = true;
    }

    function createPoll(string calldata title, string calldata description, string[] calldata options, bytes calldata eligibilityConfig)
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
        
        s_eligibilityModule.initPoll(pollId, eligibilityConfig);

        return pollId;
    }

    function whitelistUser(uint256 pollId, address user) external checkPollValidity(pollId) onlyWhenInState(pollId, 0) {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_eligibilityModule.addWhitelisted(pollId, user);
    }

    function whitelistUsers(uint256 pollId, address[] calldata users)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 0)
    {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_eligibilityModule.addWhitelistedBatch(pollId, users);
    }

    function removeWhitelisted(uint256 pollId, address user)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 0)
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
    
    function registerVoter(uint256 pollId, uint256 identityCommitment)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 0)
    {
        if (!s_eligibilityModule.isWhitelisted(pollId, msg.sender)) {
            revert VotingSystem__AddressNotWhitelisted(msg.sender);
        }
        
        ISemaphoreEligibilityModule(address(s_eligibilityModule)).registerIdentity(pollId, identityCommitment, msg.sender);
    }

    function castVoteWithProof(uint256 pollId, uint256 optionIdx, uint256 nullifierHash, uint256[8] calldata proof)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
        returns (uint256 voteId)
    {
        uint256 optionCount = s_pollManager.getPollOptionCount(pollId);
        if (optionIdx >= optionCount) {
            revert VotingSystem__InvalidOption();
        }

        ISemaphoreEligibilityModule(address(s_eligibilityModule)).verifyVote(pollId, optionIdx, nullifierHash, proof);

        address voter = address(uint160(nullifierHash));

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

    function mintResultNFT(uint256 pollId) external checkPollValidity(pollId) onlyWhenInState(pollId, 2) {
        if (s_resultNFT == address(0)) revert VotingSystem__NFTContractNotSet();

        address pollOwner = s_pollManager.getPollOwner(pollId);
        bool isOnWhitelist = s_eligibilityModule.isWhitelisted(pollId, msg.sender);

        if (msg.sender != pollOwner && !isOnWhitelist) {
            revert VotingSystem__NotAuthorizedToMint();
        }

        string memory title = s_pollManager.getPollTitle(pollId);
        string[] memory options = s_pollManager.getPollOptions(pollId);

        uint256[] memory results = s_voteStorage.getResults(pollId, options.length);

        string memory tokenURI = _constructTokenURI(pollId, title, options, results);

        ResultNFT(s_resultNFT).mintResult(msg.sender, tokenURI);
    }

    /**
     * @dev Internal helper to build the base64 encoded JSON
     */
    function _constructTokenURI(uint256 pollId, string memory title, string[] memory options, uint256[] memory results)
        internal
        pure
        returns (string memory)
    {
        string memory json = string.concat(
            '{"name": "Poll #',
            Strings.toString(pollId),
            ' Results",',
            '"description": "Results for poll: ',
            title,
            '",',
            '"attributes": ['
        );

        for (uint256 i = 0; i < options.length; i++) {
            json =
                string.concat(json, '{"trait_type": "', options[i], '", "value": ', Strings.toString(results[i]), "}");

            if (i < options.length - 1) {
                json = string.concat(json, ",");
            }
        }

        json = string.concat(json, "]}");

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
