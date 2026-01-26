// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Mock Vote Verifier
contract MockVoteVerifier {
    bool public shouldVerify = true;

    function setShouldVerify(bool _should) external {
        shouldVerify = _should;
    }

    function verifyProof(uint256[2] calldata, uint256[2][2] calldata, uint256[2] calldata, uint256[66] calldata)
        external
        view
        returns (bool)
    {
        return shouldVerify;
    }
}
