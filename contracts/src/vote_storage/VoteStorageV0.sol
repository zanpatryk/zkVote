// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVoteStorage} from "../interfaces/IVoteStorage.sol";

contract VoteStorageV0 is IVoteStorage {
    /* Events */
    event VoteCast(uint256 indexed pollId);
    
    /* Structs */
    struct Vote {
        uint256 pollId;
        uint256 choice;
    }

    /* Modifiers */
    modifier ownerOnly() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whitelistedOnly(uint256 pollId) {
        require(pollManager.isWhitelisted(pollId, msg.sender), "Not whitelisted");
        _;
    }
    
    /* State Variables */
    address public owner;
    mapping(uint256 => mapping(address => bool)) private hasVoted;   // pollId => user => hasVoted
    mapping(uint256 => mapping(uint256 => Vote)) private votes; // pollId => voteId => Vote
    mapping(uint256 => mapping(uint256 => uint256)) private voteCount; // pollId => choice => voteCount
    IPollManager public pollManager;
    
    /* Constructor */
    constructor() {
        owner = msg.sender;
    }

    /* Functions */
    function castVote(bytes calldata voteData) external {
        Vote vote = abi.decode(voteData, (Vote));
        require(pollManager.isValidPollId(vote.pollId), "Invalid pollId");
        require(pollManager.isValidOption(vote.pollId, vote.choice), "Invalid option");
        require(whitelistedOnly(vote.pollId), "Not whitelisted");
        require(!hasVoted[vote.pollId][msg.sender], "Already voted");

        votes[vote.pollId][voteCount[vote.pollId][vote.choice]++] = vote;
        hasVoted[vote.pollId][msg.sender] = true;
        voteCount[vote.pollId][vote.choice]++;
        emit VoteCast(vote.pollId);
    }

    function getVote(uint256 pollId, uint256 voteId) external view returns (bytes memory voteData) {
        return bytes(votes[pollId][voteId]);
    }
}
