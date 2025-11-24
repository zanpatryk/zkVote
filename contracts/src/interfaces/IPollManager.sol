// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPollManager {
    function createPoll(bytes calldata pollData) external ownerOnly returns (uint256 pollId);
    function isValidPollId(uint256 pollId) external view returns (bool);
    function isValidOption(uint256 pollId, uint256 option) external view returns (bool);
    function getPoll(uint256 pollId) external view returns (bytes memory pollData);
    function getPolls(address pollOwner) external view returns (uint256[] memory pollIds);
    function getPollOwner(uint256 pollId) external view returns (address);
    function getVoterPolls(address voter) external view returns (uint256[] memory pollIds);
    function getEligibilityModule(uint256 pollId) external view returns (address);
    function getVoteStorageModule(uint256 pollId) external view returns (address);
}