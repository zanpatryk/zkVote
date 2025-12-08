// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPollManager} from "../interfaces/IPollManager.sol";

// Errors
error PollManager__NotOwner();
error PollManager__EmptyOption();
error PollManager__InvalidState();

/**
 * @title Poll Manager
 * @dev This contract manages polls within the voting system.
 * It allows for the creation, state handling and retrieval of polls.
 */

contract PollManager is IPollManager {
    /*Types */
    enum State {
        CREATED,
        ACTIVE,
        ENDED
    }

    struct Poll {
        uint256 pollId;
        address owner;
        string title;
        string description;
        string[] options;
        State state;
    }

    /* State Variables */
    address public immutable i_owner;

    uint256 private s_pollCount;
    mapping(uint256 pollId => Poll pollStructure) private s_polls;

    /* Events */

    /* Modifiers */
    modifier ownerOnly() {
        if (msg.sender != i_owner) {
            revert PollManager__NotOwner();
        }
        _;
    }

    /* Functions */
    constructor(address owner) {
        i_owner = owner;
        s_pollCount = 0;
    }

    /**
     * @dev Creates a new poll with the given data.
     * @param title The title of the poll.
     * @param description The description of the poll (optional).
     * @param options The options for the poll.
     * @param creator The address of the poll creator.
     * @return pollId The ID of the created poll.
     */
    function createPoll(string calldata title, string calldata description, string[] calldata options, address creator)
        external
        ownerOnly
        returns (uint256 pollId)
    {
        s_pollCount += 1;
        pollId = s_pollCount;

        Poll storage p = s_polls[pollId];
        p.pollId = pollId;
        p.owner = creator;
        p.title = title;
        p.description = description;
        p.state = State.CREATED;

        for (uint256 i = 0; i < options.length; i++) {
            if (bytes(options[i]).length == 0) {
                revert PollManager__EmptyOption();
            }
            p.options.push(options[i]);
        }

        emit PollCreated(pollId, creator);
        return pollId;
    }

    /* Getters */
    function isValidPollId(uint256 pollId) external view returns (bool) {
        return pollId != 0 && s_polls[pollId].pollId == pollId;
    }

    function isValidOption(uint256 pollId, uint256 option) external view returns (bool) {
        return option < s_polls[pollId].options.length;
    }

    function getPollOwner(uint256 pollId) external view returns (address) {
        return s_polls[pollId].owner;
    }

    function getPollTitle(uint256 pollId) external view returns (string memory) {
        return s_polls[pollId].title;
    }

    function getPollOptionCount(uint256 pollId) external view returns (uint256) {
        return s_polls[pollId].options.length;
    }

    function getPollOption(uint256 pollId, uint256 index) external view returns (string memory) {
        return s_polls[pollId].options[index];
    }

    function getDescription(uint256 pollId) external view returns (string memory) {
        return s_polls[pollId].description;
    }

    function getPoll(uint256 pollId)
        external
        view
        returns (
            uint256 id,
            address owner,
            string memory title,
            string memory description,
            string[] memory options,
            uint8 state
        )
    {
        Poll storage p = s_polls[pollId];
        return (p.pollId, p.owner, p.title, p.description, p.options, uint8(p.state));
    }

    /* Returns the state of the poll as an uint8 ( 0 - CREATED, 1 - ACTIVE, 2 - ENDED) */
    function getState(uint256 pollId) external view returns (uint8) {
        return uint8(s_polls[pollId].state);
    }

    /* Sets the state of the poll */
    function setState(uint256 pollId, uint8 state) external ownerOnly {
        if (state > uint8(State.ENDED)) {
            revert PollManager__InvalidState();
        }
        s_polls[pollId].state = State(state);
    }
}
