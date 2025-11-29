// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVoteStorage Interface
 * @dev Defines the standard functions for all vote storage modules.
 * This interface allows for different storage methods.
 */
interface IVoteStorage {
    event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId);

    function castVote(uint256 pollId, address voter, bytes calldata voteData) external returns (uint256 voteId);
    function getVoteCount(uint256 pollId, uint256 optionIdx) external view returns (uint256);
    function getResults(uint256 pollId, uint256 optionCount) external view returns (uint256[] memory);
    function hasVoted(uint256 pollId, address user) external view returns (bool);
}
