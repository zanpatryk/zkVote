// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {EligibilityModuleV0} from "../../src/eligibility/EligibilityModuleV0.sol";

contract EligibilityModuleTest is Test {
    EligibilityModuleV0 private eligibilityModule;
    address private mockVSE = address(1);
    uint256 private pollId = 1;
    address private user1 = address(3);
    address private user2 = address(4);

    function setUp() external {
        vm.prank(mockVSE);
        eligibilityModule = new EligibilityModuleV0(mockVSE);
    }

    function testAddWhitelistedAndChecks() external {
        vm.prank(mockVSE);
        bool ok = eligibilityModule.addWhitelisted(pollId, user1);
        assertTrue(ok);

        assertTrue(eligibilityModule.isWhitelisted(pollId, user1));

        bool eligible = eligibilityModule.isEligibleToVote(pollId, abi.encode(user1));
        assertTrue(eligible);
    }

    function testAddWhitelistedBatch() external {
        address[] memory users = new address[](2);
        users[0] = user1;
        users[1] = user2;

        vm.prank(mockVSE);
        bool ok = eligibilityModule.addWhitelistedBatch(pollId, users);
        assertTrue(ok);

        assertTrue(eligibilityModule.isWhitelisted(pollId, user1));
        assertTrue(eligibilityModule.isWhitelisted(pollId, user2));
    }

    function testRemoveWhitelisted() external {
        vm.prank(mockVSE);
        eligibilityModule.addWhitelisted(pollId, user1);
        assertTrue(eligibilityModule.isWhitelisted(pollId, user1));

        vm.prank(mockVSE);
        bool ok = eligibilityModule.removeWhitelisted(pollId, user1);
        assertTrue(ok);

        assertFalse(eligibilityModule.isWhitelisted(pollId, user1));
    }

    /* Revert / negative tests */

    function testCannotAddWhitelistedByNonOwner() external {
        bytes memory expectRevert = abi.encodeWithSelector(bytes4(keccak256("EligibilityModuleV0__NotOwner()")));
        vm.expectRevert(expectRevert);

        vm.prank(user1);
        eligibilityModule.addWhitelisted(pollId, user1);
    }

    function testCannotAddDuplicateWhitelisted() external {
        vm.prank(mockVSE);
        eligibilityModule.addWhitelisted(pollId, user1);

        bytes memory expectRevert =
            abi.encodeWithSelector(bytes4(keccak256("EligibilityModuleV0__AlreadyWhitelisted()")));
        vm.expectRevert(expectRevert);

        vm.prank(mockVSE);
        eligibilityModule.addWhitelisted(pollId, user1);
    }

    function testCannotRemoveIfNotWhitelisted() external {
        assertFalse(eligibilityModule.isWhitelisted(pollId, user2));

        bytes memory expectRevert = abi.encodeWithSelector(bytes4(keccak256("EligibilityModuleV0__NotWhitelisted()")));
        vm.expectRevert(expectRevert);

        vm.prank(mockVSE);
        eligibilityModule.removeWhitelisted(pollId, user2);
    }
}
