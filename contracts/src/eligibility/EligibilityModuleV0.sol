// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/* Errors */
error EligibilityModuleV0__NotOwner();
error EligibilityModuleV0__NotPollManager();
error EligibilityModuleV0__AlreadyWhitelisted();
error EligibilityModuleV0__NotWhitelisted();

/**
 * @title Eligibility Module V0
 * @dev This contract is the first version of the eligibility module.
 * Voters are eligible to vote if they are whitelisted.
 * The poll manager is the only one who can whitelist users.
 */
contract EligibilityModuleV0 {
    /* State Variables */
    address public immutable i_owner;

    mapping(uint256 pollId => mapping(address user => bool inWhitelist)) private s_whitelist;

    /* Evenets */
    event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId);
    event EligibilityModuleV0__AddressRemovedFromWhitelist(address indexed user, uint256 indexed pollId);

    /* Modifiers */
    modifier ownerOnly() {
        if (msg.sender != i_owner) {
            revert EligibilityModuleV0__NotOwner();
        }
        _;
    }

    /* Functions */
    constructor(address owner) {
        i_owner = owner;
    }

    /**
     * @dev Returns true if the user is whitelisted for the given poll.
     */
    function isWhitelisted(uint256 pollId, address user) external view returns (bool) {
        return isEligibleToVote(pollId, user);
    }

    /**
     * @dev Adds the user to whitelist for the given poll.
     */
    function addWhitelisted(uint256 pollId, address user) external ownerOnly {
        if (isEligibleToVote(pollId, user)) {
            revert EligibilityModuleV0__AlreadyWhitelisted();
        }

        s_whitelist[pollId][user] = true;
        emit EligibilityModuleV0__AddressWhitelisted(user, pollId);
    }

    /**
     * @dev Removes the user from whitelist for the given poll.
     */
    function removeWhitelisted(uint256 pollId, address user) external ownerOnly {
        if (!isEligibleToVote(pollId, user)) {
            revert EligibilityModuleV0__NotWhitelisted();
        }

        s_whitelist[pollId][user] = false;
        emit EligibilityModuleV0__AddressRemovedFromWhitelist(user, pollId);
    }

    function isEligibleToVote(uint256 pollId, address user) internal view returns (bool) {
        return s_whitelist[pollId][user];
    }
}
