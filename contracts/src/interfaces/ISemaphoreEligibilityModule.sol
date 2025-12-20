// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IEligibilityModule} from "./IEligibilityModule.sol";

/**
 * @title ISemaphoreEligibilityModule Interface
 * @dev Extension interface for modules that support Semaphore ZK proofs.
 */
interface ISemaphoreEligibilityModule is IEligibilityModule {
    /* Errors */
    error SemaphoreEligibilityModule__NotOwner();
    error SemaphoreEligibilityModule__UserNotWhitelisted();
    error SemaphoreEligibilityModule__UserAlreadyRegistered();
    error SemaphoreEligibilityModule__GroupIsFull();
    error SemaphoreEligibilityModule__GroupAlreadyExists();
    error SemaphoreEligibilityModule__GroupDoesNotExist();

    /**
     * @dev Registers an identity commitment to the semaphore group for the poll.
     * @param user The address of the user registering the identity (must be whitelisted).
     */
    function registerIdentity(uint256 pollId, uint256 identityCommitment, address user) external returns (bool);

    /**
     * @dev Checks if a user has already registered an identity.
     */
    function isRegistered(uint256 pollId, address user) external view returns (bool);

    /**
     * @dev Verifies a ZK proof for voting.
     * @param pollId The group ID (same as poll ID).
     * @param vote The signal (vote option index).
     * @param nullifierHash The unique nullifier for this user+poll.
     * @param proof The 8-element ZK proof.
     */
    function verifyVote(uint256 pollId, uint256 vote, uint256 nullifierHash, uint256[8] calldata proof) external returns (bool);
}
