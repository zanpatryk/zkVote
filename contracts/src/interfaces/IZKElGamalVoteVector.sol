// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVoteStorage} from "./IVoteStorage.sol";
import {IZKElGamalVoteVectorVerifier} from "./IZKElGamalVoteVectorVerifier.sol";
import {IZKElGamalTallyVerifier} from "./IZKElGamalTallyVerifier.sol";
import "zkvote-lib/ZKVoteLib.sol";

interface IZKElGamalVoteVector is IVoteStorage {
    /* Errors */
    error ZKElGamalVoteVector__AlreadyVoted(address user);
    error ZKElGamalVoteVector__NotPollOwner();
    error ZKElGamalVoteVector__UseEncryptedVote();
    error ZKElGamalVoteVector__PollManagerNotSet();
    error ZKElGamalVoteVector__PollManagerCallFailed();
    error ZKElGamalVoteVector__PollAlreadyExists();
    error ZKElGamalVoteVector__InvalidVoteVerifier();
    error ZKElGamalVoteVector__InvalidTallyVerifier();
    error ZKElGamalVoteVector__PollNotInitialized();
    error ZKElGamalVoteVector__VotingClosed();
    error ZKElGamalVoteVector__InvalidVoteProof();
    error ZKElGamalVoteVector__AlreadyPublished();
    error ZKElGamalVoteVector__InvalidTallyProof();

    /* Events */
    event EncryptedVoteCasted(
        uint256 indexed pollId,
        address indexed voter,
        uint256 voteId
    );
    
    event TallyPublished(uint256 indexed pollId, uint256[16] tally);
    
    event PollInitialized(
        uint256 indexed pollId,
        uint256[2] publicKey,
        address voteVerifier,
        address tallyVerifier
    );

    /* Functions */
    
    /**
     * @notice Cast an encrypted vote with ZK proof
     */
    function castEncryptedVote(
        uint256 pollId,
        address voter,
        uint256[64] calldata encVote,
        ZKVoteLib.Proof calldata proof
    ) external returns (uint256);

    /**
     * @notice Publish verified tally results
     */
    function publishResults(
        uint256 pollId,
        uint256[16] calldata tally,
        ZKVoteLib.Proof calldata tallyProof
    ) external;

    function getAggregatedCiphertexts(uint256 pollId) external view returns (
        uint256[2][16] memory c1,
        uint256[2][16] memory c2
    );

    function getPollPublicKey(uint256 pollId) external view returns (uint256[2] memory);
    
    function getTotalVotes() external view returns (uint256);
}
