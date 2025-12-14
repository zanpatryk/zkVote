// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";

contract VoteStorageTest is Test {
    VoteStorageV0 private voteStorage;
    address private mockVSE = address(1);
    uint256 private pollId = 1;
    address private voter1 = address(2);
    address private voter2 = address(3);

    function setUp() external {
        vm.prank(mockVSE);
        voteStorage = new VoteStorageV0(mockVSE);
    }

    function testCastVote() external {
        vm.prank(mockVSE);
        uint256 voteId1 = voteStorage.castVote(pollId, voter1, abi.encode(0));

        vm.prank(mockVSE);
        uint256 voteId2 = voteStorage.castVote(pollId, voter2, abi.encode(1));

        assertEq(voteId1, 1);
        assertEq(voteId2, 2);

        assertEq(voteStorage.getVoteCount(pollId, 0), 1);
        assertEq(voteStorage.getVoteCount(pollId, 1), 1);

        assertTrue(voteStorage.hasVoted(pollId, voter1));
        assertTrue(voteStorage.hasVoted(pollId, voter2));
        assertFalse(voteStorage.hasVoted(pollId, address(4)));

        VoteStorageV0.Vote memory v1 = voteStorage.getVote(voteId1);
        assertEq(v1.voteId, voteId1);
        assertEq(v1.pollId, pollId);
        assertEq(v1.optionIdx, 0);
        assertEq(v1.voter, voter1);

        VoteStorageV0.Vote memory v2 = voteStorage.getVote(voteId2);
        assertEq(v2.voteId, voteId2);
        assertEq(v2.optionIdx, 1);
        assertEq(v2.voter, voter2);

        uint256[] memory results = voteStorage.getResults(pollId, 2);
        assertEq(results.length, 2);
        assertEq(results[0], 1);
        assertEq(results[1], 1);
    }

    /* Revert / negative tests */

    function testRevertWhenDoubleVoting() external {
        vm.prank(mockVSE);
        voteStorage.castVote(pollId, voter1, abi.encode(uint256(0)));

        bytes memory expectedRevert =
            abi.encodeWithSelector(bytes4(keccak256("VoteStorageV0__AlreadyVoted(address)")), voter1);

        vm.prank(mockVSE);
        vm.expectRevert(expectedRevert);
        voteStorage.castVote(pollId, voter1, abi.encode(uint256(1)));
    }
}
