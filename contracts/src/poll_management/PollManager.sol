// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPollManager} from "../interfaces/IPollManager.sol";

// Errors
error PollManager__NotOwner();
error PollManager__EmptyOption();

/**
 * @title Poll Manager
 * @dev This contract manages polls within the voting system.
 * It allows for the creation and retrieval of polls.
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
    mapping(address pollCreator => uint256[] pollsId) private s_OwnerToPollId;

    /* Events */
    event PollCreated(uint256 indexed pollId);

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

        s_OwnerToPollId[creator].push(pollId);
        emit PollCreated(pollId);
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

    function getPolls(address pollOwner) external view returns (uint256[] memory pollIds) {
        return s_OwnerToPollId[pollOwner];
    }

    function getDescription(uint256 pollId) external view returns (string memory) {
        return s_polls[pollId].description;
    }
}
