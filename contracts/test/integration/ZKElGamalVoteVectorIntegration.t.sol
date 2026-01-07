// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ZKElGamalVoteVector} from "../../src/vote_storage/ZKElGamalVoteVector.sol";
import "zkvote-lib/ZKVoteLib.sol";

import {MockPollManager} from "../mocks/MockPollManager.sol";
import {MockVoteVerifier} from "../mocks/MockVoteVerifier.sol";
import {MockTallyVerifier} from "../mocks/MockTallyVerifier.sol";

/**
 * @title ZKElGamalVoteVector Integration Test
 */
contract ZKElGamalVoteVectorIntegration is Test {
    ZKElGamalVoteVector public voteStorage;
    MockVoteVerifier public voteVerifier;
    MockTallyVerifier public tallyVerifier;
    MockPollManager public pollManager;
    
    address public pollOwner = address(0x1);
    uint256 public pollId = 1;
    
    // BabyJubJub Generator (Base8) - used for test key generation
    uint256 constant Gx = 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    uint256 constant Gy = 16950150798460657717958625567821834550301663161624707787222815936182638968203;
    
    // Test public key - matches Generator G for simplicity (sk=1)
    uint256[2] public encryptionKey;
    
    function setUp() public {
        // Deploy mock poll manager
        pollManager = new MockPollManager();
        pollManager.setPollOwner(pollId, pollOwner);
        
        // Deploy MOCK verifiers
        voteVerifier = new MockVoteVerifier();
        tallyVerifier = new MockTallyVerifier();
        
        // Deploy vote storage
        voteStorage = new ZKElGamalVoteVector(address(pollManager));
        
        // Use Generator as public key
        encryptionKey = [Gx, Gy];
    }
    
    // ============ Integration Tests ============
    
    /// @notice Test initialization with mock verifiers
    function testInitializeWithMockVerifiers() public {
        bytes memory initData = abi.encode(encryptionKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
        
        (bool initialized, , , address vVerifier, address tVerifier, ) = voteStorage.polls(pollId);
        assertTrue(initialized);
        assertEq(vVerifier, address(voteVerifier));
        assertEq(tVerifier, address(tallyVerifier));
        
        // Check public key stored correctly
        uint256[2] memory pk = voteStorage.getPollPublicKey(pollId);
        assertEq(pk[0], encryptionKey[0]);
        assertEq(pk[1], encryptionKey[1]);
    }

    // Helpers
    function _buildMockEncVote(uint256 selectedOption) internal pure returns (uint256[64] memory encVote) {
        // Option 0: C1=(1,2), C2=(3,4)
        uint256 base = selectedOption * 4;
        if (base < 64) {
             encVote[base] = 1; 
             encVote[base+1] = 2; 
             encVote[base+2] = 3; 
             encVote[base+3] = 4;
        }
    }
    
    function _buildMockProof() internal pure returns (ZKVoteLib.Proof memory proof) {
        proof.a = [uint256(1), uint256(2)];
        proof.b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        proof.c = [uint256(7), uint256(8)];
    }
    /// @notice Test 10 voters casting votes
    function testTenVoters() public {
        // Initialize first
        bytes memory initData = abi.encode(encryptionKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);

        for (uint256 i = 0; i < 10; i++) {
            address voter = address(uint160(0x1000 + i));
            uint256 option = i % 3; // Votes distributed across options 0, 1, 2
            
            uint256[64] memory encVote = _buildMockEncVote(option);
            ZKVoteLib.Proof memory proof = _buildMockProof();
            
            voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
        }
        
        assertEq(voteStorage.getVoteCount(pollId, 0), 10);
        assertEq(voteStorage.getTotalVotes(), 10);
    }
    
    /// @notice Test 50 voters casting votes
    function testFiftyVoters() public {
        bytes memory initData = abi.encode(encryptionKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);

        for (uint256 i = 0; i < 50; i++) {
            address voter = address(uint160(0x2000 + i));
            uint256 option = i % 5; // Votes distributed across options 0-4
            
            uint256[64] memory encVote = _buildMockEncVote(option);
            ZKVoteLib.Proof memory proof = _buildMockProof();
            
            voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
        }
        
        assertEq(voteStorage.getVoteCount(pollId, 0), 50);
        assertEq(voteStorage.getTotalVotes(), 50);
        
        // Verify individual votes can be retrieved
        ZKElGamalVoteVector.EncryptedVote memory vote = voteStorage.getVote(1);
        assertEq(vote.pollId, pollId);
        
        vote = voteStorage.getVote(50);
        assertEq(vote.voteId, 50);
    }
    
    /// @notice Test full flow: 100 voters + publish results
    function testFullFlowWithManyVoters() public {
        bytes memory initData = abi.encode(encryptionKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
        
        uint256 voterCount = 100;
        
        // Cast 100 votes
        for (uint256 i = 0; i < voterCount; i++) {
            address voter = address(uint160(0x4000 + i));
            uint256 option = i % 16;
            
            uint256[64] memory encVote = _buildMockEncVote(option);
            ZKVoteLib.Proof memory proof = _buildMockProof();
            
            voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
        }
        
        assertEq(voteStorage.getTotalVotes(), voterCount);
        
        // Verify aggregated ciphertexts exist
        (uint256[2][16] memory c1, uint256[2][16] memory c2) = voteStorage.getAggregatedCiphertexts(pollId);
        assertTrue(c1[0][0] != 0 || c1[0][1] != 1, "C1 should be aggregated");
        assertTrue(c2[0][0] != 0 || c2[0][1] != 1, "C2 should be aggregated");
        
        // Publish results (with mock tally - proof passes automatically)
        uint256[16] memory tally;
        for (uint256 i = 0; i < 16; i++) {
            tally[i] = voterCount / 16 + (i < voterCount % 16 ? 1 : 0);
        }
        
        voteStorage.publishResults(pollId, tally, _buildMockProof());
        
        // Verify results published
        uint256[] memory results = voteStorage.getResults(pollId, 16);
        assertEq(results.length, 16);
        
        uint256 totalFromResults;
        for (uint256 i = 0; i < 16; i++) {
            totalFromResults += results[i];
        }
        assertEq(totalFromResults, voterCount);
    }
    
    /// @notice Test that double voting is prevented
    function testDoubleVotePrevention() public {
        bytes memory initData = abi.encode(encryptionKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
        
        address voter = address(0x5000);
        
        uint256[64] memory encVote = _buildMockEncVote(0);
        ZKVoteLib.Proof memory proof = _buildMockProof();
        
        voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
        
        vm.expectRevert(abi.encodeWithSignature(
            "ZKElGamalVoteVector__AlreadyVoted(address)",
            voter
        ));
        voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
    }
}


