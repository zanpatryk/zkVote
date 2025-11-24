// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PollManager {
    struct Poll {
        address owner;
        /* ... */
    }

    address public owner;
    mapping(uint256 => Poll) private polls;
    mapping(uint256 => address) private eligibilityModule;   // pollId => EligibilityModule address
    mapping(uint256 => address) private voteStorageModule;   // pollId => VoteStorageModule address
    
    constructor() {
        owner = msg.sender;
    }

    function getPollOwner(uint256 pollId) external view returns (address) {}
    function isValidPollId(uint256 pollId) external view returns (bool) {}
    function isValidOption(uint256 pollId, uint256 option) external view returns (bool) {}
    function createPoll(bytes calldata pollData) external ownerOnly returns (uint256 pollId) {}
    function getPoll(uint256 pollId) external view returns (bytes memory pollData) {}
    function getPolls(address pollOwner) external view returns (uint256[] memory pollIds) {}
    function getVoterPolls(address voter) external view returns (uint256[] memory pollIds) {}
    function getEligibilityModule(uint256 pollId) external view returns (address) {}
    function getVoteStorageModule(uint256 pollId) external view returns (address) {}
}
