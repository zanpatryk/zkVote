// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SemaphoreEligibilityModule} from "../../src/eligibility/SemaphoreEligibilityModule.sol";
import {ISemaphoreEligibilityModule} from "../../src/interfaces/ISemaphoreEligibilityModule.sol";
import {MockSemaphoreVerifier} from "../mocks/MockSemaphoreVerifier.sol";

contract SemaphoreEligibilityModuleTest is Test {
    SemaphoreEligibilityModule public module;
    MockSemaphoreVerifier public verifier;
    
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        verifier = new MockSemaphoreVerifier();
        
        // Deploy module with 'owner' as the admin (simulating VotingSystemEngine)
        module = new SemaphoreEligibilityModule(verifier, owner);
    }

    /* InitPoll Tests */

    function test_InitPoll_DefaultDepth() public {
        uint256 pollId = 1;
        
        bool success = module.initPoll(pollId, "");
        assertTrue(success);
        
        uint256 depth = module.getMerkleTreeDepth(pollId);
        assertEq(depth, 20, "Default depth should be 20");
    }

    function test_InitPoll_CustomDepth() public {
        uint256 pollId = 2;
        bytes memory config = abi.encode(uint256(30));
        
        module.initPoll(pollId, config);
        
        uint256 depth = module.getMerkleTreeDepth(pollId);
        assertEq(depth, 30, "Depth should be 30");
    }

    function test_InitPoll_GroupAlreadyExists() public {
        uint256 pollId = 1;
        module.initPoll(pollId, "");
        
        vm.expectRevert(ISemaphoreEligibilityModule.SemaphoreEligibilityModule__GroupAlreadyExists.selector);
        module.initPoll(pollId, "");
    }

    /* Whitelist Tests */

    function test_Whitelist() public {
        uint256 pollId = 1;
        module.initPoll(pollId, "");

        vm.startPrank(owner);
        bool success = module.addWhitelisted(pollId, user1);
        assertTrue(success);
        assertTrue(module.isWhitelisted(pollId, user1));
        
        // Add duplicate should return false but not revert
        assertFalse(module.addWhitelisted(pollId, user1));
        
        module.removeWhitelisted(pollId, user1);
        assertFalse(module.isWhitelisted(pollId, user1));
        vm.stopPrank();
    }

    /* Registration Tests */

    function test_RegisterIdentity_Success() public {
        uint256 pollId = 1;
        
        vm.startPrank(owner);
        module.initPoll(pollId, "");
        module.addWhitelisted(pollId, user1);
        
        uint256 identityCommitment = 123456;
        
        // Prank as owner because registerIdentity is ownerOnly
        bool success = module.registerIdentity(pollId, identityCommitment, user1);
        assertTrue(success);
        
        assertTrue(module.isRegistered(pollId, user1));
        vm.stopPrank();
    }

    function test_RegisterIdentity_Fail_NotWhitelisted() public {
        uint256 pollId = 1;
        
        vm.startPrank(owner);
        module.initPoll(pollId, "");
        
        uint256 identityCommitment = 123456;
        
        vm.expectRevert(ISemaphoreEligibilityModule.SemaphoreEligibilityModule__UserNotWhitelisted.selector);
        module.registerIdentity(pollId, identityCommitment, user1);
        vm.stopPrank();
    }

    function test_RegisterIdentity_Fail_AlreadyRegistered() public {
        uint256 pollId = 1;

        vm.startPrank(owner);
        module.initPoll(pollId, "");
        module.addWhitelisted(pollId, user1);
        uint256 identityCommitment = 123456;
        
        module.registerIdentity(pollId, identityCommitment, user1);
        
        // Try registering again
        vm.expectRevert(ISemaphoreEligibilityModule.SemaphoreEligibilityModule__UserAlreadyRegistered.selector);
        module.registerIdentity(pollId, identityCommitment, user1);
        vm.stopPrank();
    }

    function test_RegisterIdentity_Fail_NotOwner() public {
        uint256 pollId = 1;
        module.initPoll(pollId, "");
        
        vm.prank(user1);
        vm.expectRevert(ISemaphoreEligibilityModule.SemaphoreEligibilityModule__NotOwner.selector);
        module.registerIdentity(pollId, 123, user1);
    }
}
