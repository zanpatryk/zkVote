// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "zkvote-lib/ZKVoteLib.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IVoteStorage.sol";
import "../interfaces/IZKElGamalVoteVectorVerifier.sol";
import "../interfaces/IZKElGamalTallyVerifier.sol";
import "../interfaces/IZKElGamalVoteVector.sol";

/**
 * @title ZKElGamalVoteVector
 * @notice Stores and validates ZK votes using ElGamal Vector Encryption (N=16)
 * @dev On-chain aggregation of encrypted votes with verifiable tally
 */
contract ZKElGamalVoteVector is IVoteStorage, IZKElGamalVoteVector, Ownable {
    uint256 public constant N = 16; // Number of options

    struct EncryptedVote {
        uint256 voteId;
        uint256 pollId;
        address voter;
        uint256[64] encVote; // [C1.x, C1.y, C2.x, C2.y] × 16 options
    }

    struct PollState {
        bool initialized;
        uint256[2] publicKey;
        uint256[2][16] aggC1;     // Aggregated C1 per option
        uint256[2][16] aggC2;     // Aggregated C2 per option
        uint256[16] tally;
        uint256 voteCount;
        bool resultsPublished;
        address voteVerifier;
        address tallyVerifier;
        address pollOwner;
    }

    mapping(uint256 => PollState) public polls;
    mapping(uint256 pollId => mapping(address voter => bool)) private s_hasVoted;
    mapping(uint256 voteId => EncryptedVote) private s_votes;
    uint256 private s_totalVotes;
    
    address public pollManager;

    constructor(address _pollManager) Ownable(msg.sender) {
        pollManager = _pollManager;
    }

    function initPoll(
        uint256 pollId,
        bytes calldata initData
    ) external override {
        (uint256[2] memory publicKey, address voteVerifier, address tallyVerifier) = abi.decode(initData, (uint256[2], address, address));
        _initPoll(pollId, publicKey, voteVerifier, tallyVerifier);
    }
    
    function _initPoll(
        uint256 pollId,
        uint256[2] memory publicKey,
        address voteVerifier,
        address tallyVerifier
    ) internal {
        // Only VSE (owner) calls this
        if (msg.sender != owner()) revert ZKElGamalVoteVector__NotPollOwner();
        if (pollManager == address(0)) revert ZKElGamalVoteVector__PollManagerNotSet();
        
        (bool success, bytes memory data) = pollManager.staticcall(
            abi.encodeWithSignature("getPollOwner(uint256)", pollId)
        );
        if (!success) revert ZKElGamalVoteVector__PollManagerCallFailed();
        address owner = abi.decode(data, (address));
        
        if (polls[pollId].initialized) revert ZKElGamalVoteVector__PollAlreadyExists();
        if (voteVerifier == address(0)) revert ZKElGamalVoteVector__InvalidVoteVerifier();
        if (tallyVerifier == address(0)) revert ZKElGamalVoteVector__InvalidTallyVerifier();
        
        PollState storage poll = polls[pollId];
        poll.initialized = true;
        poll.publicKey = publicKey;
        poll.voteVerifier = voteVerifier;
        poll.tallyVerifier = tallyVerifier;
        poll.pollOwner = owner;
        
        // Initialize aggregated ciphertexts to identity (0, 1)
        for (uint256 i = 0; i < N; i++) {
            poll.aggC1[i] = [uint256(0), uint256(1)];
            poll.aggC2[i] = [uint256(0), uint256(1)];
        }
        
        emit PollInitialized(pollId, publicKey, voteVerifier, tallyVerifier);
    }

    function castVote(
        uint256 pollId,
        address voter,
        bytes calldata voteData
    ) external override returns (uint256) {
        if (msg.sender != pollManager && msg.sender != owner()) revert ZKElGamalVoteVector__NotPollOwner();
        
        (uint256[64] memory encVote, ZKVoteLib.Proof memory proof) = abi.decode(voteData, (uint256[64], ZKVoteLib.Proof));
        return _castEncryptedVote(pollId, voter, encVote, proof);
    }

    /**
     * @notice Cast an encrypted vote with ZK proof
     * @param pollId Poll ID
     * @param voter Address of the voter
     * @param encVote Flattened encrypted vote: [C1.x, C1.y, C2.x, C2.y] × 16 options = 64 values
     * @param proof ZK proof of valid encryption
     */
    function castEncryptedVote(
        uint256 pollId,
        address voter,
        uint256[64] calldata encVote,
        ZKVoteLib.Proof calldata proof
    ) external override onlyOwner returns (uint256) {
        return _castEncryptedVote(pollId, voter, encVote, proof);
    }

    function _castEncryptedVote(
        uint256 pollId,
        address voter,
        uint256[64] memory encVote,
        ZKVoteLib.Proof memory proof
    ) internal returns (uint256) {
        PollState storage poll = polls[pollId];
        if (!poll.initialized) revert ZKElGamalVoteVector__PollNotInitialized();
        if (poll.resultsPublished) revert ZKElGamalVoteVector__VotingClosed();
        if (s_hasVoted[pollId][voter]) revert ZKElGamalVoteVector__AlreadyVoted(voter);
        
        // Build public signals: encVote (64) + pk (2) = 66
        uint256[66] memory pubSignals;
        
        // Copy encVote directly (already flattened)
        for (uint256 i = 0; i < 64; i++) {
            pubSignals[i] = encVote[i];
        }
        
        pubSignals[64] = poll.publicKey[0];
        pubSignals[65] = poll.publicKey[1];
        
        // Verify vote proof
        if (
            !IZKElGamalVoteVectorVerifier(poll.voteVerifier).verifyProof(
                proof.a,
                proof.b,
                proof.c,
                pubSignals
            )
        ) {
            revert ZKElGamalVoteVector__InvalidVoteProof();
        }
        
        // Aggregate ciphertexts on-chain
        // encVote layout: [opt0_C1x, opt0_C1y, opt0_C2x, opt0_C2y, opt1_C1x, ...]
        for (uint256 i = 0; i < N; i++) {
            uint256 base = i * 4;
            poll.aggC1[i] = ZKVoteLib.addPoint(
                poll.aggC1[i],
                [encVote[base], encVote[base + 1]]
            );
            poll.aggC2[i] = ZKVoteLib.addPoint(
                poll.aggC2[i],
                [encVote[base + 2], encVote[base + 3]]
            );
        }
        
        // Track voter
        s_hasVoted[pollId][voter] = true;
        poll.voteCount++;
        s_totalVotes++;
        
        // Store encrypted vote
        uint256 voteId = s_totalVotes;
        s_votes[voteId] = EncryptedVote({
            voteId: voteId,
            pollId: pollId,
            voter: voter,
            encVote: encVote
        });
        
        emit VoteCasted(pollId, voter, voteId);
        emit EncryptedVoteCasted(pollId, voter, voteId);
        
        return voteId;
    }

    /**
     * @notice Publish verified tally results (poll owner only)
     */
    function publishResults(
        uint256 pollId,
        uint256[16] calldata tally,
        ZKVoteLib.Proof calldata tallyProof
    ) external override onlyOwner {
        PollState storage poll = polls[pollId];
        if (!poll.initialized) revert ZKElGamalVoteVector__PollNotInitialized();
        if (poll.resultsPublished) revert ZKElGamalVoteVector__AlreadyPublished();
        
        // Build public signals: pk (2) + aggC1 (32) + aggC2 (32) + tally (16) = 82
        uint256[82] memory pubSignals;
        uint256 idx = 0;
        
        pubSignals[idx++] = poll.publicKey[0];
        pubSignals[idx++] = poll.publicKey[1];
        
        for (uint256 i = 0; i < N; i++) {
            pubSignals[idx++] = poll.aggC1[i][0];
            pubSignals[idx++] = poll.aggC1[i][1];
        }
        
        for (uint256 i = 0; i < N; i++) {
            pubSignals[idx++] = poll.aggC2[i][0];
            pubSignals[idx++] = poll.aggC2[i][1];
        }
        
        for (uint256 i = 0; i < N; i++) {
            pubSignals[idx++] = tally[i];
        }
        
        if (!IZKElGamalTallyVerifier(poll.tallyVerifier).verifyProof(
            tallyProof.a, tallyProof.b, tallyProof.c, pubSignals
        )) {
            revert ZKElGamalVoteVector__InvalidTallyProof();
        }
        
        poll.tally = tally;
        poll.resultsPublished = true;
        
        emit TallyPublished(pollId, tally);
    }

    // ============ View Functions ============

    function getVoteCount(uint256 pollId, uint256) external view override returns (uint256) {
        return polls[pollId].voteCount;
    }

    function hasVoted(uint256 pollId, address voter) external view override returns (bool) {
        return s_hasVoted[pollId][voter];
    }

    function getResults(uint256 pollId, uint256) external view override returns (uint256[] memory) {
        PollState storage poll = polls[pollId];
        uint256[] memory results = new uint256[](N);
        if (poll.resultsPublished) {
            for (uint256 i = 0; i < N; i++) {
                results[i] = poll.tally[i];
            }
        }
        return results;
    }

    function getAggregatedCiphertexts(uint256 pollId) external view override returns (
        uint256[2][16] memory c1,
        uint256[2][16] memory c2
    ) {
        return (polls[pollId].aggC1, polls[pollId].aggC2);
    }

    function getPollPublicKey(uint256 pollId) external view override returns (uint256[2] memory) {
        return polls[pollId].publicKey;
    }

    function getVote(uint256 voteId) external view returns (EncryptedVote memory) {
        return s_votes[voteId];
    }
    
    function getTotalVotes() external view override returns (uint256) {
        return s_totalVotes;
    }
}
