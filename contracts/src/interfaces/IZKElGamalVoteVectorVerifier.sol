// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IZKElGamalVoteVectorVerifier
 * @notice Verifier for ElGamalVoteVector circuit (N=16, 66 signals)
 */
interface IZKElGamalVoteVectorVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[66] calldata pubSignals
    ) external view returns (bool);
}
