// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IEligibilityModule Interface
 * @dev Defines the standard functions for all eligibility modules.
 * This interface allows for different eligibility methods (whitelist, ZK membership, etc.).
 */
interface IEligibilityModule {
    /* Events */
    event Whitelisted(address indexed user, uint256 indexed pollId);
    event RemovedWhitelisted(address indexed user, uint256 indexed pollId);

    /* Functions */
    function isWhitelisted(uint256 pollId, address user) external view returns (bool);
    function addWhitelisted(uint256 pollId, address user) external returns (bool);
    function addWhitelistedBatch(uint256 pollId, address[] calldata users) external returns (bool);
    function removeWhitelisted(uint256 pollId, address user) external returns (bool);
    function isEligibleToVote(uint256 pollId, bytes calldata data) external view returns (bool);
}
