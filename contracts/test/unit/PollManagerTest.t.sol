// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";

contract PollManagerTest is Test {
    PollManager private pollManager;
    address private mockVSE = address(1);
    address private pollOwner = address(2);
    string[] private options;

    function setUp() external {
        options.push("Option 1");
        options.push("Option 2");

        vm.prank(mockVSE);
        pollManager = new PollManager(mockVSE);
    }

    function testCreatePoll() external {
        vm.prank(mockVSE);
        uint256 pollId = pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);

        bool isValidPollId = pollManager.isValidPollId(pollId);
        bool isValidOption = pollManager.isValidOption(pollId, 0);
        address returnedPollOwner = pollManager.getPollOwner(pollId);
        string memory returnedTitle = pollManager.getPollTitle(pollId);
        uint256 optionCount = pollManager.getPollOptionCount(pollId);
        string memory returnedOption = pollManager.getPollOption(pollId, 0);
        string memory returnedDescription = pollManager.getDescription(pollId);
        uint8 returnedState = pollManager.getState(pollId);

        assertEq(returnedState, 0);
        assertEq(returnedDescription, "This is a test poll");
        assertEq(returnedOption, "Option 1");
        assertEq(optionCount, 2);
        assertEq(returnedTitle, "Test Poll");
        assertEq(returnedPollOwner, pollOwner);
        assertTrue(isValidOption);
        assertTrue(isValidPollId);
    }

    function testGetPoll() external {
        vm.prank(mockVSE);
        uint256 pollId = pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);

        (
            uint256 id,
            address owner,
            string memory title,
            string memory description,
            string[] memory returnedOptions,
            uint8 state
        ) = pollManager.getPoll(pollId);

        assertEq(id, pollId);
        assertEq(owner, pollOwner);
        assertEq(title, "Test Poll");
        assertEq(description, "This is a test poll");
        assertEq(returnedOptions.length, 2);
        assertEq(returnedOptions[0], "Option 1");
        assertEq(returnedOptions[1], "Option 2");
        assertEq(state, 0);
    }

    function testSetState() external {
        vm.startPrank(mockVSE);
        uint256 pollId = pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);
        pollManager.setState(pollId, 1);
        vm.stopPrank();

        uint8 returnedState = pollManager.getState(pollId);
        assertEq(returnedState, 1);
    }

    /* Revert / negative tests */

    function testRevertCreatePollNotOwner() external {
        vm.expectRevert("PollManager__NotOwner()");
        pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);
    }

    function testRevertEmptyOption() external {
        options.push("");
        vm.prank(mockVSE);
        vm.expectRevert("PollManager__EmptyOption()");
        pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);
    }

    function testRevertSetStateInvalidState() external {
        vm.prank(mockVSE);
        uint256 pollId = pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);

        vm.prank(mockVSE);
        vm.expectRevert("PollManager__InvalidState()");
        pollManager.setState(pollId, 3);
    }

    function testRevertSetStateNotOwner() external {
        vm.prank(mockVSE);
        uint256 pollId = pollManager.createPoll("Test Poll", "This is a test poll", options, pollOwner);

        vm.expectRevert("PollManager__NotOwner()");
        pollManager.setState(pollId, 1);
    }
}
