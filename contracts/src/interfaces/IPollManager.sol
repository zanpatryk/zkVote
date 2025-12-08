// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPollManager {
    event PollCreated(uint256 indexed pollId, address indexed creator);

    function createPoll(string calldata title, string calldata description, string[] calldata options, address creator)
        external
        returns (uint256 pollId);
    function isValidPollId(uint256 pollId) external view returns (bool);
    function isValidOption(uint256 pollId, uint256 option) external view returns (bool);

    function getPollOwner(uint256 pollId) external view returns (address);
    function getPollTitle(uint256 pollId) external view returns (string memory);
    function getPollOptionCount(uint256 pollId) external view returns (uint256);
    function getPollOption(uint256 pollId, uint256 index) external view returns (string memory);
    function getDescription(uint256 pollId) external view returns (string memory);
    function getState(uint256 pollId) external view returns (uint8);
    function setState(uint256 pollId, uint8 state) external;
}
