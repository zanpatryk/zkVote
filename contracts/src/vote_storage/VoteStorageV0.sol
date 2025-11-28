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
    /* State Variables */
    address public immutable i_owner;

    mapping(uint256 pollId => mapping(address user => bool voted)) private s_hasVoted;
    mapping(uint256 pollId => mapping(uint256 option => uint256 voteCounter)) private s_voteCount;

    /* Events */
    event VoteCasted(uint256 indexed pollId);

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
    }

    /**
     * @dev Records a vote for the given poll and option by the voter.
     * @param pollId The ID of the poll.
     * @param optionIdx The index of the option being voted for.
     * @param voter The address of the voter.
     */
    function castVote(uint256 pollId, uint256 optionIdx, address voter) external ownerOnly {
        if (s_hasVoted[pollId][voter]) {
            revert VoteStorageV0__AlreadyVoted(voter);
        }

        s_hasVoted[pollId][voter] = true;
        s_voteCount[pollId][optionIdx] += 1;
        emit VoteCasted(pollId);
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
}
