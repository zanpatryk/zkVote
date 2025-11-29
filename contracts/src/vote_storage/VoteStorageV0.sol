// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVoteStorage} from "../interfaces/IVoteStorage.sol";

/* Errors */
error VoteStorageV0__OnlyOwner();
error VoteStorageV0__AlreadyVoted(address user);

/**
 * @title Vote Storage V0
 * @dev This contract is the first version of the vote storage module.
 * It stores the votes casted by users and keeps track of the vote counts for each option.
 */
contract VoteStorageV0 is IVoteStorage {
    /* Structs */
    struct Vote {
        uint256 voteId;
        uint256 pollId;
        uint256 optionIdx;
        address voter;
    }

    /* State Variables */
    address public immutable i_owner;

    mapping(uint256 pollId => mapping(address user => bool voted)) private s_hasVoted;
    mapping(uint256 pollId => mapping(uint256 option => uint256 voteCounter)) private s_voteCount;
    
    uint256 private s_totalVotes;
    mapping(uint256 voteId => Vote) private s_votes;

    /* Events */

    /* Modifiers */
    modifier ownerOnly() {
        if (msg.sender != i_owner) {
            revert VoteStorageV0__OnlyOwner();
        }
        _;
    }

    /* Functions */
    constructor(address owner) {
        i_owner = owner;
        s_totalVotes = 0;
    }

    /**
     * @dev Records a vote for the given poll.
     * @param pollId The ID of the poll.
     * @param voter The address of the voter.
     * @param voteData The encoded vote data (uint256 optionIdx for V0).
     */
    function castVote(uint256 pollId, address voter, bytes calldata voteData) external ownerOnly returns (uint256 voteId) {
        uint256 optionIdx = abi.decode(voteData, (uint256));

        if (s_hasVoted[pollId][voter]) {
            revert VoteStorageV0__AlreadyVoted(voter);
        }

        s_hasVoted[pollId][voter] = true;
        s_voteCount[pollId][optionIdx] += 1;
        
        s_totalVotes += 1;
        voteId = s_totalVotes;
        
        s_votes[voteId] = Vote({
            voteId: voteId,
            pollId: pollId,
            optionIdx: optionIdx,
            voter: voter
        });

        emit VoteCasted(pollId, voter, voteId);
        return voteId;
    }

    function getVoteCount(uint256 pollId, uint256 optionIdx) external view returns (uint256) {
        return s_voteCount[pollId][optionIdx];
    }

    function getResults(uint256 pollId, uint256 optionCount) external view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](optionCount);
        for (uint256 i = 0; i < optionCount; ++i) {
            results[i] = s_voteCount[pollId][i];
        }
        return results;
    }

    function hasVoted(uint256 pollId, address user) external view returns (bool) {
        return s_hasVoted[pollId][user];
    }

    function getVote(uint256 voteId) external view returns (Vote memory) {
        return s_votes[voteId];
    }
}
