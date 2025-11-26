// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/mock/VotingSystemMock.sol";

contract VotingSystemMockTest is Test {
    VotingSystemMock voting;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address charlie = address(0xC0C);
    address dave = address(0xD444);

    function setUp() public {
        voting = new VotingSystemMock();
    }

    /*---------------------------------------------------------
                        createPoll()
    ----------------------------------------------------------*/
    function testCreatePoll() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("hello");

        assertTrue(pollId != 0);
        assertEq(voting.nextPollId(), 2);
        assertEq(voting.getOwnedPolls(alice).length, 1);
        assertEq(voting.getOwnedPolls(alice)[0], pollId);
    }

    /*---------------------------------------------------------
                    getOwnedPolls() — multi-poll
    ----------------------------------------------------------*/
    function testGetOwnedPollsMultiple() public {
        vm.startPrank(alice);
        uint256 p1 = voting.createPoll("p1");
        uint256 p2 = voting.createPoll("p2");
        uint256 p3 = voting.createPoll("p3");
        vm.stopPrank();

        uint256[] memory polls = voting.getOwnedPolls(alice);
        assertEq(polls.length, 3);
        assertEq(polls[0], p1);
        assertEq(polls[1], p2);
        assertEq(polls[2], p3);
    }

    /*---------------------------------------------------------
                        Whitelist tests
    ----------------------------------------------------------*/
    function testWhitelistUser() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        vm.prank(alice);
        voting.whitelistUser(pollId, bob);

        bool status = voting.isWhitelisted(pollId, bob);
        assertEq(status, true);
    }

    function testRemoveWhitelistUser() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        vm.startPrank(alice);
        voting.whitelistUser(pollId, bob);
        voting.removeWhitelisted(pollId, bob);
        vm.stopPrank();

        bool status = voting.isWhitelisted(pollId, bob);
        assertEq(status, false);
    }

    function testWhitelistRevertsIfNotCreator() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        vm.prank(bob);
        vm.expectRevert("Not poll creator");
        voting.whitelistUser(pollId, charlie);
    }

    /*---------------------------------------------------------
                        Voting tests
    ----------------------------------------------------------*/
    function testCastVote() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        vm.prank(alice);
        voting.whitelistUser(pollId, bob);

        vm.prank(bob);
        voting.castVote(pollId, "YES");

        uint256[] memory bobPolls = voting.getVoterPolls(bob);
        assertEq(bobPolls.length, 1);
        assertEq(bobPolls[0], pollId);
    }

    function testCastVoteRevertsIfNotWhitelisted() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        vm.prank(bob);
        vm.expectRevert("Not whitelisted");
        voting.castVote(pollId, "YES");
    }

    /*---------------------------------------------------------
                        Event tests
    ----------------------------------------------------------*/
    function testPollCreatedEvent() public {
        vm.warp(100); // Set timestamp to ensure consistency
        
        uint256 currentId = voting.nextPollId();
        uint256 expectedId = uint256(keccak256(abi.encodePacked(alice, block.timestamp, currentId)));
        
        vm.expectEmit(true, true, false, true);
        emit VotingSystemMock.PollCreated(expectedId, alice);

        vm.prank(alice);
        voting.createPoll("abc");
    }

    /*---------------------------------------------------------
                        New Feature Tests
    ----------------------------------------------------------*/
    function testDoubleVotingReverts() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        vm.prank(alice);
        voting.whitelistUser(pollId, bob);

        vm.startPrank(bob);
        voting.castVote(pollId, "YES");
        
        vm.expectRevert("Already voted");
        voting.castVote(pollId, "NO");
        vm.stopPrank();
    }

    function testBatchWhitelisting() public {
        vm.prank(alice);
        uint256 pollId = voting.createPoll("poll");

        address[] memory users = new address[](3);
        users[0] = bob;
        users[1] = charlie;
        users[2] = dave;

        vm.prank(alice);
        voting.whitelistUsers(pollId, users);

        assertTrue(voting.isWhitelisted(pollId, bob));
        assertTrue(voting.isWhitelisted(pollId, charlie));
        assertTrue(voting.isWhitelisted(pollId, dave));
    }
}
