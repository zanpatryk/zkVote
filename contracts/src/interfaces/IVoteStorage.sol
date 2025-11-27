// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVoteStorage Interface
 * @dev Defines the standard functions for all vote storage modules.
 * This interface allows for different storage methods.
 */
interface IVoteStorage {
    function castVote(uint256 pollId, uint256 optionIdx, address voter) external;
    function getVoteCount(uint256 pollId, uint256 optionIdx) external view returns (uint256);
    function getResults(uint256 pollId, uint256 optionCount) external view returns (uint256[] memory);
}
