// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISemaphoreEligibilityModule} from "../interfaces/ISemaphoreEligibilityModule.sol";
import {Semaphore} from "@semaphore-protocol/contracts/Semaphore.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import {ISemaphore} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract SemaphoreEligibilityModule is ISemaphoreEligibilityModule, Semaphore {
    address public immutable i_moduleOwner;
    mapping(uint256 => bool) public s_groups;
    
    // Whitelist storage: pollId -> user -> whitelisted
    mapping(uint256 => mapping(address => bool)) private s_whitelist;
    // Track if a user has already registered an identity to prevent duplicates
    mapping(uint256 => mapping(address => bool)) private s_hasRegistered;
    // Track configured depth of the group tree per poll
    mapping(uint256 => uint256) private s_pollDepths;

    constructor(ISemaphoreVerifier _verifier, address _owner) Semaphore(_verifier) {
        i_moduleOwner = _owner;
    }

    modifier ownerOnly() {
        if (msg.sender != i_moduleOwner) {
            revert SemaphoreEligibilityModule__NotOwner();
        }
        _;
    }

    /* IEligibilityModule (Whitelist) Implementation */
    
    function isWhitelisted(uint256 pollId, address user) external view override returns (bool) {
        return s_whitelist[pollId][user];
    }
    
    function addWhitelisted(uint256 pollId, address user) external override ownerOnly returns (bool) {
        if (s_whitelist[pollId][user]) return false;
        s_whitelist[pollId][user] = true;
        emit Whitelisted(user, pollId);
        return true;
    }

    function addWhitelistedBatch(uint256 pollId, address[] calldata users) external override ownerOnly returns (bool) {
        for (uint256 i = 0; i < users.length; ++i) {
            address user = users[i];
            if (!s_whitelist[pollId][user]) {
                s_whitelist[pollId][user] = true;
                emit Whitelisted(user, pollId);
            }
        }
        return true;
    }

    function removeWhitelisted(uint256 pollId, address user) external override ownerOnly returns (bool) {
        if (!s_whitelist[pollId][user]) return false;
        s_whitelist[pollId][user] = false;
        emit RemovedWhitelisted(user, pollId);
        return true;
    }

    function isEligibleToVote(uint256, bytes calldata) external pure override returns (bool) {
        return false;
    }

    /* Lifecycle Hook */

    function initPoll(uint256 pollId, bytes calldata config) external override returns (bool) {
        if (s_groups[pollId]) {
             revert SemaphoreEligibilityModule__GroupAlreadyExists();
        }
        
        uint256 depth = 20;
        if (config.length > 0) {
            depth = abi.decode(config, (uint256));
        }
        s_pollDepths[pollId] = depth;

        _createGroup(pollId, msg.sender);
        s_groups[pollId] = true;
        return true;
    }

    /* ZK Functions */
    
    function registerIdentity(uint256 pollId, uint256 identityCommitment, address user) external override ownerOnly returns (bool) {
        if (!s_groups[pollId]) {
            revert SemaphoreEligibilityModule__GroupDoesNotExist();
        }

        if (!s_whitelist[pollId][user]) {
            revert SemaphoreEligibilityModule__UserNotWhitelisted();
        }
        
        if (s_hasRegistered[pollId][user]) {
            revert SemaphoreEligibilityModule__UserAlreadyRegistered();
        }

        uint256 depth = s_pollDepths[pollId];
        // Enforce capacity based on depth (ZK verifier constraint)
        if (getMerkleTreeSize(pollId) >= 2**depth) {
            revert SemaphoreEligibilityModule__GroupIsFull();
        }
        
        _addMember(pollId, identityCommitment);
        s_hasRegistered[pollId][user] = true;
        
        return true;
    }

    function isRegistered(uint256 pollId, address user) external view override returns (bool) {
        return s_hasRegistered[pollId][user];
    }

    function verifyVote(uint256 pollId, uint256 vote, uint256 nullifierHash, uint256[8] calldata proof) external view override returns (bool) {
        uint256 merkleTreeRoot = getMerkleTreeRoot(pollId);
        uint256 merkleTreeDepth = s_pollDepths[pollId];
        
        ISemaphore.SemaphoreProof memory semaphoreProof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: merkleTreeDepth,
            merkleTreeRoot: merkleTreeRoot,
            nullifier: nullifierHash,
            message: vote,
            scope: pollId,
            points: proof
        });

        return this.verifyProof(pollId, semaphoreProof);
    }

    function getMerkleTreeDepth(uint256 pollId) public view override returns (uint256) {
        return s_pollDepths[pollId];
    }
}
