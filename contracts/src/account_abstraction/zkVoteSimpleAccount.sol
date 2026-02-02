// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/**
 * @title zkVoteSimpleAccount
 * @notice Minimal ERC-4337-compatible smart account used with PollSponsorPaymaster.
 *
 * Features:
 * - Single EOA owner.
 * - execute(target,value,data) restricted to the configured EntryPoint.
 * - validateUserOp verifies an ECDSA signature over userOpHash by the owner.
 * - Optional funding via receive(), so the account can hold ETH if needed.
 *
 * This contract is intentionally simple and tailored for the zkVote use case:
 * sponsoring plain VotingSystemEngine.castVote calls via the custom paymaster.
 */
contract zkVoteSimpleAccount {
    /// @notice EOA that controls this account.
    address public owner;

    /// @notice EntryPoint contract used for ERC-4337 account abstraction.
    IEntryPoint public entryPoint;

    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "zkVoteSimpleAccount: only entryPoint");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "zkVoteSimpleAccount: only owner");
        _;
    }

    constructor(address _owner, IEntryPoint _entryPoint) {
        require(_owner != address(0), "zkVoteSimpleAccount: owner is zero");
        require(address(_entryPoint) != address(0), "zkVoteSimpleAccount: entryPoint is zero");
        owner = _owner;
        entryPoint = _entryPoint;
        emit OwnerChanged(address(0), _owner);
    }

    /**
     * @notice Change the owner of this account.
     * @dev Optional convenience for tests / administration.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zkVoteSimpleAccount: new owner is zero");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice EntryPoint hook to validate a UserOperation.
     *
     * Requirements:
     * - msg.sender MUST be the configured EntryPoint.
     * - userOp.signature must contain a valid 65-byte ECDSA signature by `owner`
     *   over `userOpHash` (no additional prefixing).
     * - Optionally, missingAccountFunds can be handled by sending ETH to
     *   EntryPoint; for zkVote we rely on the paymaster, so we ignore it.
     *
     * @return validationData 0 on success (valid), 1 on failure.
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /*missingAccountFunds*/
    ) external onlyEntryPoint returns (uint256 validationData) {
        bytes calldata sig = userOp.signature;
        if (sig.length != 65) {
            return 1;
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;

        // Expect an Ethereum Signed Message signature over userOpHash
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
        );

        address signer = ecrecover(ethSignedHash, v, r, s);
        return signer == owner ? 0 : 1;
    }

    /**
     * @notice Execute a call from EntryPoint.
     * @dev This is the entry point for UserOperations once validated.
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyEntryPoint returns (bool success, bytes memory result) {
        require(target != address(0), "zkVoteSimpleAccount: target is zero");

        (success, result) = target.call{value: value}(data);
    }

    /**
     * @notice Allow the account to receive ETH (e.g., for deposits or refunds).
     */
    receive() external payable {}
}

