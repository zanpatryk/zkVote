// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VotingSystemMock – Updated with getOwnedPolls()
 */
contract VotingSystemMock {
    /*======================================================
                            EVENTS
    ======================================================*/
    event PollCreated(uint256 pollId, address creator);
    event VoteCast(uint256 pollId, uint256 voteId);
    event UserWhitelisted(uint256 pollId, address user);
    event UserRemovedFromWhitelist(uint256 pollId, address user);

    /*======================================================
                        STATE STRUCTS
    ======================================================*/
    struct Poll {
        address creator;
        bytes data;
    }

    struct Vote {
        address voter;
        bytes data;
    }

    /*======================================================
                         STATE STORAGE
    ======================================================*/
    address public owner;
    uint256 public nextPollId = 1;

    // pollId => Poll
    mapping(uint256 => Poll) public polls;

    // pollOwner => pollIds[]  ← This is what we use for getOwnedPolls
    mapping(address => uint256[]) public pollOwnerList;

    // voter => pollIds[]
    mapping(address => uint256[]) public voterPollList;

    // pollId => voteId => Vote
    mapping(uint256 => mapping(uint256 => Vote)) public pollVotes;

    // pollId => voteCount
    mapping(uint256 => uint256) public pollVoteCount;

    // Track all poll IDs
    uint256[] public allPolls;

    // pollId => user => whitelisted
    mapping(uint256 => mapping(address => bool)) public whitelist;

    // pollId => user => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /*======================================================
                          MODIFIERS
    ======================================================*/
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyPollCreator(uint256 pollId) {
        require(polls[pollId].creator == msg.sender, "Not poll creator");
        _;
    }

    /*======================================================
                          CONSTRUCTOR
    ======================================================*/
    constructor() {
        owner = msg.sender;
    }

    /*======================================================
                          POLL LOGIC
    ======================================================*/
    function createPoll(bytes calldata pollData)
        external
        returns (uint256 pollId)
    {
        uint256 currentId = nextPollId++;
        pollId = uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp, currentId)));
        polls[pollId] = Poll(msg.sender, pollData);
        pollOwnerList[msg.sender].push(pollId); // ← tracked here
        allPolls.push(pollId);

        emit PollCreated(pollId, msg.sender);
    }

    function getPoll(uint256 pollId)
        external
        view
        returns (bytes memory pollData)
    {
        return polls[pollId].data;
    }

    function getOwnedPolls(address pollOwner)
        external
        view
        returns (uint256[] memory pollIds)
    {
        return pollOwnerList[pollOwner];
    }

    function getAllPolls()
        external
        view
        returns (uint256[] memory)
    {
        return allPolls;
    }
    // ───────────────────────────────────────────────────────────

    /*======================================================
                          WHITELIST
    ======================================================*/
    function whitelistUser(uint256 pollId, address user)
        external
        onlyPollCreator(pollId)
    {
        whitelist[pollId][user] = true;
        emit UserWhitelisted(pollId, user);
    }

    function removeWhitelisted(uint256 pollId, address user)
        external
        onlyPollCreator(pollId)
    {
        whitelist[pollId][user] = false;
        emit UserRemovedFromWhitelist(pollId, user);
    }

    function whitelistUsers(uint256 pollId, address[] calldata users)
        external
        onlyPollCreator(pollId)
    {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[pollId][users[i]] = true;
            emit UserWhitelisted(pollId, users[i]);
        }
    }

    function isWhitelisted(uint256 pollId, address user)
        external
        view
        returns (bool)
    {
        return whitelist[pollId][user];
    }

    /*======================================================
                            VOTING
    ======================================================*/
    function registerToVote(uint256 pollId, bytes calldata /* voterData */)
        external
    {}

    function castVote(uint256 pollId, bytes calldata voteData)
        external
        returns (uint256 voteId)
    {
        require(whitelist[pollId][msg.sender], "Not whitelisted");
        require(!hasVoted[pollId][msg.sender], "Already voted");

        hasVoted[pollId][msg.sender] = true;

        uint256 currentVoteCount = pollVoteCount[pollId]++;
        voteId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, currentVoteCount)));
        
        pollVotes[pollId][voteId] = Vote(msg.sender, voteData);
        voterPollList[msg.sender].push(pollId);

        emit VoteCast(pollId, voteId);
    }

    function getVote(uint256 pollId, uint256 voteId)
        external
        view
        returns (bytes memory voteData)
    {
        return pollVotes[pollId][voteId].data;
    }

    function getVoterPolls(address voter)
        external
        view
        returns (uint256[] memory pollIds)
    {
        return voterPollList[voter];
    }
}