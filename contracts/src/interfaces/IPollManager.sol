// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPollManager {
    function createPoll(string calldata title, string calldata description, string[] calldata options, address creator)
        external
        returns (uint256 pollId);
    function isValidPollId(uint256 pollId) external view returns (bool);
    function isValidOption(uint256 pollId, uint256 option) external view returns (bool);
    function getPolls(address pollOwner) external view returns (uint256[] memory pollIds);
    function getPollOwner(uint256 pollId) external view returns (address);
    function getPollTitle(uint256 pollId) external view returns (string memory);
    function getPollOptionCount(uint256 pollId) external view returns (uint256);
    function getPollOption(uint256 pollId, uint256 index) external view returns (string memory);
    function getDescription(uint256 pollId) external view returns (string memory);

    //function getVoterPolls(address voter) external view returns (uint256[] memory pollIds); - not sure if here
}
