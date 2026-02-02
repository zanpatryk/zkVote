// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ZKElGamalVoteVector} from "../../src/vote_storage/ZKElGamalVoteVector.sol";
import "zkvote-lib/ZKVoteLib.sol";

import {MockPollManager} from "../mocks/MockPollManager.sol";
import {MockVoteVerifier} from "../mocks/MockVoteVerifier.sol";
import {MockTallyVerifier} from "../mocks/MockTallyVerifier.sol";

contract ZKElGamalVoteVectorTest is Test {
    ZKElGamalVoteVector public voteStorage;
    MockPollManager public pollManager;
    MockVoteVerifier public voteVerifier;
    MockTallyVerifier public tallyVerifier;
    
    address public owner = address(this);
    address public pollOwner = address(0x1);
    address public voter = address(0x2);
    address public voter2 = address(0x3);
    uint256 public pollId = 1;
    uint256[2] public publicKey = [uint256(123), uint256(456)];
    
    function setUp() public {
        pollManager = new MockPollManager();
        voteVerifier = new MockVoteVerifier();
        tallyVerifier = new MockTallyVerifier();
        
        voteStorage = new ZKElGamalVoteVector(address(pollManager));
        pollManager.setPollOwner(pollId, pollOwner);
    }
    
    function _initPoll() internal {
        // VSE (owner) calls initializePoll
        bytes memory initData = abi.encode(publicKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
    }
    
    // Build mock flattened encrypted vote: [C1.x, C1.y, C2.x, C2.y] × 16 options
    function _buildMockEncVote() internal pure returns (uint256[64] memory encVote) {
        // Option 0: C1=(1,2), C2=(3,4)
        encVote[0] = 1;  // opt0 C1.x
        encVote[1] = 2;  // opt0 C1.y
        encVote[2] = 3;  // opt0 C2.x
        encVote[3] = 4;  // opt0 C2.y
        // Options 1-15 are zeros
    }
    
    function _buildMockProof() internal pure returns (ZKVoteLib.Proof memory proof) {
        proof.a = [uint256(1), uint256(2)];
        proof.b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        proof.c = [uint256(7), uint256(8)];
    }
    
    function _castVote(address _voter) internal returns (uint256) {
        uint256[64] memory encVote = _buildMockEncVote();
        ZKVoteLib.Proof memory proof = _buildMockProof();
        return voteStorage.castEncryptedVote(pollId, _voter, encVote, proof);
    }
    
    // ============ Initialization Tests ============
    
    function testInitializePoll() public {
        bytes memory initData = abi.encode(publicKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
        
        (bool initialized, uint256 voteCount, bool resultsPublished, address vVerifier, address tVerifier, ) = voteStorage.polls(pollId);
        assertTrue(initialized);
        assertEq(voteCount, 0);
        assertFalse(resultsPublished);
        assertEq(vVerifier, address(voteVerifier));
        assertEq(tVerifier, address(tallyVerifier));
    }
        
    function testRevertInitializeAlreadyExists() public {
        _initPoll();
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__PollAlreadyExists()"));
        bytes memory initData = abi.encode(publicKey, address(voteVerifier), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
    }
    
    function testRevertInitializeInvalidVoteVerifier() public {
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__InvalidVoteVerifier()"));
        bytes memory initData = abi.encode(publicKey, address(0), address(tallyVerifier));
        voteStorage.initPoll(pollId, initData);
    }
    
    function testRevertInitializeInvalidTallyVerifier() public {
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__InvalidTallyVerifier()"));
        bytes memory initData = abi.encode(publicKey, address(voteVerifier), address(0));
        voteStorage.initPoll(pollId, initData);
    }
    
    // ============ Interface Compatibility ============
    
    function testCastVoteGenericInterface() public {
        _initPoll();
        
        uint256[64] memory encVote = _buildMockEncVote();
        ZKVoteLib.Proof memory proof = _buildMockProof();
        bytes memory data = abi.encode(encVote, proof);
        
        uint256 voteId = voteStorage.castVote(pollId, voter, data);
        
        assertEq(voteId, 1);
        assertEq(voteStorage.getVoteCount(pollId, 0), 1);
    }
    
    // ============ Cast Encrypted Vote Tests ============
    
    function testCastEncryptedVote() public {
        _initPoll();
        
        uint256 voteId = _castVote(voter);
        
        assertEq(voteId, 1);
        assertEq(voteStorage.getVoteCount(pollId, 0), 1);
        assertEq(voteStorage.getTotalVotes(), 1);
    }
    
    function testCastEncryptedVoteUpdatesHasVoted() public {
        _initPoll();
        
        assertFalse(voteStorage.hasVoted(pollId, voter));
        _castVote(voter);
        assertTrue(voteStorage.hasVoted(pollId, voter));
    }
    
    function testCastEncryptedVoteStoresVote() public {
        _initPoll();
        
        uint256 voteId = _castVote(voter);
        
        ZKElGamalVoteVector.EncryptedVote memory storedVote = voteStorage.getVote(voteId);
        assertEq(storedVote.voteId, voteId);
        assertEq(storedVote.pollId, pollId);
        assertEq(storedVote.voter, voter);
        assertEq(storedVote.encVote[0], 1); // C1.x of option 0
    }
    
    function testCastMultipleEncryptedVotes() public {
        _initPoll();
        
        _castVote(voter);
        _castVote(voter2);
        
        assertEq(voteStorage.getVoteCount(pollId, 0), 2);
        assertEq(voteStorage.getTotalVotes(), 2);
    }
    
    function testRevertCastEncryptedVoteNotInitialized() public {
        uint256[64] memory encVote = _buildMockEncVote();
        ZKVoteLib.Proof memory proof = _buildMockProof();
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__PollNotInitialized()"));
        voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
    }
    
    function testRevertCastEncryptedVoteAlreadyVoted() public {
        _initPoll();
        _castVote(voter);
        
        uint256[64] memory encVote = _buildMockEncVote();
        ZKVoteLib.Proof memory proof = _buildMockProof();
        
        vm.expectRevert(abi.encodeWithSignature(
            "ZKElGamalVoteVector__AlreadyVoted(address)",
            voter
        ));
        voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
    }
    
    function testRevertCastEncryptedVoteInvalidProof() public {
        _initPoll();
        voteVerifier.setShouldVerify(false);
        
        uint256[64] memory encVote = _buildMockEncVote();
        ZKVoteLib.Proof memory proof = _buildMockProof();
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__InvalidVoteProof()"));
        voteStorage.castEncryptedVote(pollId, voter, encVote, proof);
    }
    
    function testRevertCastEncryptedVoteVotingClosed() public {
        _initPoll();
        _castVote(voter);
        
        // Publish results to close voting
        uint256[16] memory tally;
        voteStorage.publishResults(pollId, tally, _buildMockProof());
        
        uint256[64] memory encVote = _buildMockEncVote();
        ZKVoteLib.Proof memory proof = _buildMockProof();
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__VotingClosed()"));
        voteStorage.castEncryptedVote(pollId, voter2, encVote, proof);
    }
    
    // ============ Publish Results Tests ============
    
    function testPublishResults() public {
        _initPoll();
        _castVote(voter);
        
        uint256[16] memory tally;
        tally[0] = 1;
        
        voteStorage.publishResults(pollId, tally, _buildMockProof());
        
        uint256[] memory results = voteStorage.getResults(pollId, 16);
        assertEq(results[0], 1);
        
        (, , bool resultsPublished, , , ) = voteStorage.polls(pollId);
        assertTrue(resultsPublished);
    }
    
    function testRevertPublishResultsNotInitialized() public {
        uint256[16] memory tally;
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__PollNotInitialized()"));
        voteStorage.publishResults(pollId, tally, _buildMockProof());
    }
    
    // testRevertPublishResultsNotOwner removed - logic moved to VSE
    
    function testRevertPublishResultsAlreadyPublished() public {
        _initPoll();
        _castVote(voter);
        
        uint256[16] memory tally;
        
        voteStorage.publishResults(pollId, tally, _buildMockProof());
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__AlreadyPublished()"));
        voteStorage.publishResults(pollId, tally, _buildMockProof());
    }
    
    function testRevertPublishResultsInvalidProof() public {
        _initPoll();
        _castVote(voter);
        
        tallyVerifier.setShouldVerify(false);
        uint256[16] memory tally;
        
        vm.expectRevert(abi.encodeWithSignature("ZKElGamalVoteVector__InvalidTallyProof()"));
        voteStorage.publishResults(pollId, tally, _buildMockProof());
    }
    
    // ============ View Functions Tests ============
    
    function testGetResultsBeforePublish() public {
        _initPoll();
        _castVote(voter);
        
        uint256[] memory results = voteStorage.getResults(pollId, 16);
        
        for (uint256 i = 0; i < 16; i++) {
            assertEq(results[i], 0);
        }
    }
    
    function testGetAggregatedCiphertexts() public {
        _initPoll();
        
        (uint256[2][16] memory c1Before, ) = voteStorage.getAggregatedCiphertexts(pollId);
        assertEq(c1Before[0][0], 0);
        assertEq(c1Before[0][1], 1);
        
        _castVote(voter);
        
        (uint256[2][16] memory c1After, ) = voteStorage.getAggregatedCiphertexts(pollId);
        // After vote with encVote[0]=1, encVote[1]=2, the C1 should change
        assertTrue(c1After[0][0] != 0 || c1After[0][1] != 1);
    }
}
