// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {SemaphoreEligibilityModule} from "../../src/eligibility/SemaphoreEligibilityModule.sol";
import {ISemaphoreEligibilityModule} from "../../src/interfaces/ISemaphoreEligibilityModule.sol";
import {MockSemaphoreVerifier} from "../mocks/MockSemaphoreVerifier.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";

contract SemaphoreVotingTest is Test {
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

        // 1. Deploy Engine first
        engine = new VotingSystemEngine();
        
        // 2. Deploy Dependencies with Engine as owner where required
        pollManager = new PollManager(address(engine));
        
        // VoteStorage uses immutable owner
        voteStorage = new VoteStorageV0(address(engine));
        
        verifier = new MockSemaphoreVerifier();
        
        // SemaphoreModule uses immutable owner
        semaphoreModule = new SemaphoreEligibilityModule(verifier, address(engine));
        
        resultNFT = new ResultNFT("ZK Vote", "ZKV", owner);
        
        // 3. Initialize Engine
        engine.initialize(
            address(pollManager),
            address(semaphoreModule),
            address(voteStorage),
            address(resultNFT)
        );

        // Transfer ownerships to Engine
        // No transfers needed as we passed engine in constructors
        
        vm.stopPrank();
    }

    function test_SemaphoreFlow() public {
        vm.startPrank(owner);
        
        // 1. Create Poll
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        
        // This will call initPoll on module with config
        bytes memory config = abi.encode(uint256(20));
        uint256 pollId = engine.createPoll("ZK Poll", "Desc", options, config);
        
        // 2. Whitelist User1
        engine.whitelistUser(pollId, user1);
        
        vm.stopPrank();
        
        // 3. Register Identity as User1
        vm.startPrank(user1);
        uint256 identityCommitment = 12345;
        engine.registerVoter(pollId, identityCommitment);
        vm.stopPrank();

        // 4. Start Poll
        vm.startPrank(owner);
        engine.startPoll(pollId); // State -> 1 (Active)
        vm.stopPrank();

        // 5. Build Proof (Mocked)
        // We mocked verifier to return true.
        // We just need to pass proper shapes.
        uint256[8] memory proof;
        for(uint i=0; i<8; i++) proof[i] = i; 
        
        // Cast Vote
        // Voter address in storage will be address(uint160(nullifierHash))
        // Anyone can submit the proof if they have it (User relayer/anonymous)
        // But typically the user does it.
        vm.prank(user1); 
        uint256 vote = 1; // Option 1
        uint256 nullifierHash = 99999;
        
        engine.castVoteWithProof(pollId, vote, nullifierHash, proof);
        
        // 6. Verify Results
        // Vote count for option 1 should be 1
        uint256 count = voteStorage.getVoteCount(pollId, 1);
        assertEq(count, 1);
        
        // Verify "voter" has voted
        address nullifierAddr = address(uint160(nullifierHash));
        bool hasVoted = voteStorage.hasVoted(pollId, nullifierAddr);
    }

    function test_DoubleRegistration_Reverts() public {
        vm.startPrank(owner);
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";
        uint256 pollId = engine.createPoll("Double Reg", "Desc", options, abi.encode(uint256(20)));
        engine.whitelistUser(pollId, user1);
        vm.stopPrank();

        vm.startPrank(user1);
        engine.registerVoter(pollId, 11111);
        
        vm.expectRevert(ISemaphoreEligibilityModule.SemaphoreEligibilityModule__UserAlreadyRegistered.selector);
        engine.registerVoter(pollId, 11111);
        vm.stopPrank();
    }

    function test_MaxCapacity_Reverts() public {
        vm.startPrank(owner);
        string[] memory options = new string[](2);
        options[0] = "A";
        options[1] = "B";
        
        // Depth 1 means capacity is 2^1 = 2 users
        uint256 pollId = engine.createPoll("Tiny Poll", "Desc", options, abi.encode(uint256(1)));
        
        // Whitelist 3 users
        address user3 = address(4);
        engine.whitelistUser(pollId, user1);
        engine.whitelistUser(pollId, user2);
        engine.whitelistUser(pollId, user3);
        vm.stopPrank();

        // Register 1
        vm.prank(user1);
        engine.registerVoter(pollId, 101);

        // Register 2 (Full)
        vm.prank(user2);
        engine.registerVoter(pollId, 102);

        // Register 3 (Should fail)
        vm.prank(user3);
        // Should revert with GroupIsFull
        vm.expectRevert(ISemaphoreEligibilityModule.SemaphoreEligibilityModule__GroupIsFull.selector); 
        engine.registerVoter(pollId, 103);
    }
}
