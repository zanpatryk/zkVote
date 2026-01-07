// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {VotingSystemEngine, VotingSystem__AddressNotWhitelisted, VotingSystem__InvalidPollState, VotingSystem__InvalidOption} from "../../src/core/VotingSystemEngine.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {SemaphoreEligibilityModule} from "../../src/eligibility/SemaphoreEligibilityModule.sol";
import {MockSemaphoreVerifier} from "../mocks/MockSemaphoreVerifier.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";

contract VotingSystemEngineTest is Test {
    VotingSystemEngine public engine;
    PollManager public pollManager;
    VoteStorageV0 public voteStorage;
    SemaphoreEligibilityModule public semaphoreModule;
    MockSemaphoreVerifier public verifier;
    ResultNFT public resultNFT;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        vm.startPrank(owner);
        engine = new VotingSystemEngine();
        pollManager = new PollManager(address(engine));
        voteStorage = new VoteStorageV0(address(engine));
        verifier = new MockSemaphoreVerifier();
        semaphoreModule = new SemaphoreEligibilityModule(verifier, address(engine));
        resultNFT = new ResultNFT("ZK Vote", "ZKV", owner);
        
        engine.initialize(
            address(pollManager),
            address(semaphoreModule),
            address(voteStorage),
            address(resultNFT)
        );
        vm.stopPrank();
    }

    /* ZK Registration Tests */

    function test_RegisterVoter_Revert_NotWhitelisted() public {
        vm.startPrank(owner);
        string[] memory options = new string[](2);
        options[0] = "Yes"; options[1] = "No";
        uint256 pollId = engine.createPoll("Poll", "Desc", options, "", "", address(0), address(0));
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(VotingSystem__AddressNotWhitelisted.selector, user1));
        engine.registerVoter(pollId, 12345);
    }

    function test_RegisterVoter_Revert_WrongState() public {
        vm.startPrank(owner);
        string[] memory options = new string[](2);
        options[0] = "Yes"; options[1] = "No";
        uint256 pollId = engine.createPoll("Poll", "Desc", options, "", "", address(0), address(0));
        engine.whitelistUser(pollId, user1);
        
        // Advance to Active state
        engine.startPoll(pollId);
        vm.stopPrank();

        vm.prank(user1);
        vm.expectRevert(VotingSystem__InvalidPollState.selector);
        engine.registerVoter(pollId, 12345);
    }

    function test_CastVoteWithProof_Revert_WrongState() public {
        vm.startPrank(owner);
        string[] memory options = new string[](2);
        options[0] = "Yes"; options[1] = "No";
        uint256 pollId = engine.createPoll("Poll", "Desc", options, "", "", address(0), address(0));
        engine.whitelistUser(pollId, user1);
        vm.stopPrank();

        // Register while in Created state
        vm.prank(user1);
        engine.registerVoter(pollId, 12345);

        // Try to vote while still in Created (State 0)
        uint256[8] memory proof;
        vm.prank(user1);
        vm.expectRevert(VotingSystem__InvalidPollState.selector);
        engine.castVoteWithProof(pollId, 0, 999, proof);
    }

    function test_CastVoteWithProof_Revert_InvalidOption() public {
        vm.startPrank(owner);
        string[] memory options = new string[](2);
        options[0] = "Yes"; options[1] = "No";
        uint256 pollId = engine.createPoll("Poll", "Desc", options, "", "", address(0), address(0));
        engine.whitelistUser(pollId, user1);
        vm.stopPrank();

        vm.prank(user1);
        engine.registerVoter(pollId, 12345);

        vm.startPrank(owner);
        engine.startPoll(pollId);
        vm.stopPrank();

        uint256[8] memory proof;
        
        vm.prank(user1);
        vm.expectRevert(VotingSystem__InvalidOption.selector);
        // Option 2 invalid (only 0 and 1 exist)
        engine.castVoteWithProof(pollId, 2, 999, proof);
    }
}
