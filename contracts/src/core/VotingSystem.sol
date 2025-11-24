// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPollManager} from "../interfaces/IPollManager.sol";

/**
 * @title Voting System
 * @dev This contract is the main contract for the voting system.
 * It is the entry point for all voting related operations.
 */
contract VotingSystem {
    /* Events */
    /* ... */

    /* State Variables */
    address public owner;
    IPollManager public pollManager;

    /* Modifiers */
    /* ... */

    /* Functions */
    constructor(address _pollManager) {
        owner = msg.sender;
        pollManager = _pollManager;
    }

    function changePollManager(address _pollManager) external ownerOnly {}
    function createPoll(bytes calldata pollData) external returns (uint256 pollId) {}
    function getPoll(uint256 pollId) external view returns (bytes memory pollData) {}
    function getPolls(address pollOwner) external view returns (uint256[] memory pollIds) {}
    function getVoterPolls(address voter) external view returns (uint256[] memory pollIds) {}
    function whitelistUser(uint256 pollId, address user) external {}
    function removeWhitelisted(uint256 pollId, address user) external {}
    function isWhitelisted(uint256 pollId, address user) external view returns (bool) {}
    function registerToVote(uint256 pollId, bytes calldata voterData) external {}
    function castVote(uint256 pollId, bytes calldata voteData) external returns (uint256 voteId) {}
    function getVote(uint256 pollId, uint256 voteId) external view returns (bytes memory voteData) {}
}