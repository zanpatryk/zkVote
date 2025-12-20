// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

contract MockSemaphoreVerifier is ISemaphoreVerifier {
    bool private s_shouldVerify;

    constructor() {
        s_shouldVerify = true;
    }

    function setShouldVerify(bool shouldVerify) external {
        s_shouldVerify = shouldVerify;
    }

    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[4] calldata,
        uint256
    ) external view override returns (bool) {
        return s_shouldVerify;
    }
}
