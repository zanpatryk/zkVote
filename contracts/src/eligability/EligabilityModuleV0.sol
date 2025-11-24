pragma solidity ^0.8.20;

import {IEligibilityModule} from "../interfaces/IEligibilityModule.sol";

/**
 * @title Eligibility Module V0
 * @dev This contract is the first version of the eligibility module. 
 * Voters are eligible to vote if they are whitelisted.
 * The poll manager is the only one who can whitelist users.
 */
contract EligabilityModuleV0 is IEligibilityModule {    
    /* State Variables */
    address public owner;
    mapping(uint256 => mapping(address => bool)) private whitelisted;    // pollId => user => isWhitelisted
    IPollManager public pollManager;

    /* Modifiers */
    modifier ownerOnly() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier pollManagerOnly(uint256 pollId) {
        require(msg.sender == address(_pollManager.getPollOwner(pollId)), "Not poll manager");
        _;
    }
    
    /* Constructor */
    constructor(address _owner, IPollManager _pollManager) {
        owner = _owner;
        pollManager = _pollManager;
    }

    /**
     * @dev Returns true if the user is whitelisted for the given poll.
     */
    function isWhitelisted(uint256 pollId, address user) external view returns (bool) {
        return whitelisted[pollId][user];
    }

    /**
     * @dev Adds the user to the whitelist for the given poll.
     */
    function addWhitelisted(uint256 pollId, address user) external pollManagerOnly(pollId) {
        require(!whitelisted[pollId][user], "User already whitelisted");
        whitelisted[pollId][user] = true;
        emit Whitelisted(user, pollId);
    }

    function removeWhitelisted(uint256 pollId, address user) external pollManagerOnly(pollId) {
        require(whitelisted[pollId][user], "User not whitelisted");
        whitelisted[pollId][user] = false;
        emit RemovedWhitelisted(user, pollId);
    }

    function isEligibleToVote(uint256 pollId, address user) external view returns (bool) {
        return isWhitelisted(pollId, user);
    }
}
