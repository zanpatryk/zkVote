// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock PollManager for testing
contract MockPollManager {
    mapping(uint256 => address) public pollOwners;
    
    function setPollOwner(uint256 pollId, address owner) external {
        pollOwners[pollId] = owner;
    }
    
    function getPollOwner(uint256 pollId) external view returns (address) {
        return pollOwners[pollId];
    }
}
