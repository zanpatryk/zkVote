// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IZKElGamalTallyVerifier
 * @notice Verifier for ElGamalTallyDecrypt circuit (N=16, 82 signals)
 */
interface IZKElGamalTallyVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[82] calldata pubSignals
    ) external view returns (bool);
}
