// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IVoteStorage Interface
 * @dev Defines the standard functions for all vote storage modules.
 * This interface allows for different storage methods.
 */
interface IVoteStorage {    
    /* Events */
    event VoteCast(uint256 indexed pollId);
    
    /* Functions */
    function castVote(uint256 pollId, bytes calldata voteData) external;
    function getVote(uint256 pollId, uint256 voteId) external view returns (bytes memory voteData);
}