// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPollManager} from "../interfaces/IPollManager.sol";
import {IEligibilityModule} from "../interfaces/IEligibilityModule.sol";
import {IVoteStorage} from "../interfaces/IVoteStorage.sol";

/* Errors */
error VotingSystem__NotOwner();
error VotingSystem__AlreadyInitialized();
error VotingSystem__EmptyTitle();
error VotingSystem__InvalidNumberOfOptions();
error VotingSystem__AddressNotWhitelisted(address user);
error VotingSystem__InvalidPollId();
error VotingSystem__InvalidOption();

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

    modifier initializedOnly() {
        if (s_initializationFlag) {
            revert VotingSystem__AlreadyInitialized();
        }
        _;
    }

    /* Functions */
    constructor() {
        i_owner = msg.sender;
    }

    function initialize(address pollManager, address eligibilityModule, address voteStorage) external ownerOnly {
        s_pollManager = IPollManager(pollManager);
        s_eligibilityModule = IEligibilityModule(eligibilityModule);
        s_voteStorage = IVoteStorage(voteStorage);
        s_initializationFlag = true;
    }

    function createPoll(string calldata title, string calldata description, string[] calldata options, address creator)
        external
        returns (uint256 pollId)
    {
        if (bytes(title).length == 0) {
            revert VotingSystem__EmptyTitle();
        }

        if (options.length < 2) {
            revert VotingSystem__InvalidNumberOfOptions();
        }

        pollId = s_pollManager.createPoll(title, description, options, creator);

        return pollId;
    }

    function whitelistUser(uint256 pollId, address user) external checkPollValidity(pollId) {
        s_eligibilityModule.addWhitelisted(pollId, user);
    }

    function removeWhitelisted(uint256 pollId, address user) external checkPollValidity(pollId) {
        s_eligibilityModule.removeWhitelisted(pollId, user);
    }

    function isWhitelisted(uint256 pollId, address user) external view checkPollValidity(pollId) returns (bool) {
        return s_eligibilityModule.isWhitelisted(pollId, user);
    }

    function castVote(uint256 pollId, uint256 optionIdx) external checkPollValidity(pollId) {
        address voter = msg.sender;
        if (!s_eligibilityModule.isWhitelisted(pollId, voter)) {
            revert VotingSystem__AddressNotWhitelisted(voter);
        }

        uint256 optionCount = s_pollManager.getPollOptionCount(pollId);
        if (optionIdx >= optionCount) {
            revert VotingSystem__InvalidOption();
        }

        s_voteStorage.castVote(pollId, optionIdx, voter);
    }
}
