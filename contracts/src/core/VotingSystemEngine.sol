// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IPollManager} from "../interfaces/IPollManager.sol";
import {IEligibilityModule} from "../interfaces/IEligibilityModule.sol";
import {ISemaphoreEligibilityModule} from "../interfaces/ISemaphoreEligibilityModule.sol";
import {IVoteStorage} from "../interfaces/IVoteStorage.sol";
import {IZKElGamalVoteVector} from "../interfaces/IZKElGamalVoteVector.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {ResultNFT} from "../result_nft/ResultNFT.sol";
import "zkvote-lib/ZKVoteLib.sol";

/* Errors */
error VotingSystem__NotOwner();
error VotingSystem__AlreadyInitialized();
error VotingSystem__InvalidAddress();
error VotingSystem__EmptyTitle();
error VotingSystem__InvalidNumberOfOptions();
error VotingSystem__AddressNotWhitelisted(address user);
error VotingSystem__InvalidPollId();
error VotingSystem__InvalidOption();
error VotingSystem__InvalidPollState();
error VotingSystem__NotPollOwner();
error VotingSystem__NotAuthorizedToMint();
error VotingSystem__NFTContractNotSet();

/**
 * @title Voting System Engine
 * @dev Main entry point for all voting operations.
 * Supports plain voting, ZK encrypted voting and anonymous voting.
 */
contract VotingSystemEngine {
    /* State variables */
    address public immutable i_owner;
    IPollManager public s_pollManager;
    IVoteStorage public s_defaultVoteStorage;
    IEligibilityModule public s_defaultEligibility;
    mapping(uint256 => IVoteStorage) public s_pollVoteStorage;
    mapping(uint256 => IEligibilityModule) public s_pollEligibility;
    address public s_resultNFT;
    bool public s_initializationFlag;

    /* Events */

    event EncryptedVoteCast(uint256 indexed pollId, address indexed voter, uint256 voteId);
    event EncryptedResultsPublished(uint256 indexed pollId);

    /* Modifiers */
    modifier ownerOnly() {
        if (msg.sender != i_owner) {
            revert VotingSystem__NotOwner();
        }
        _;
    }

    modifier checkPollValidity(uint256 pollId) {
        if (!s_pollManager.isValidPollId(pollId)) {
            revert VotingSystem__InvalidPollId();
        }
        _;
    }

    modifier onlyWhenInState(uint256 pollId, uint8 requiredState) {
        uint8 currentState = s_pollManager.getState(pollId);
        if (currentState != requiredState) {
            revert VotingSystem__InvalidPollState();
        }
        _;
    }

    /* Functions */
    constructor() {
        i_owner = msg.sender;
    }

    function initialize(
        address pollManager,
        address defaultEligibilityModule,
        address defaultVoteStorage,
        address resultNFTAddress
    ) external ownerOnly {
        if (s_initializationFlag) {
            revert VotingSystem__AlreadyInitialized();
        }
        if (pollManager == address(0) || defaultVoteStorage == address(0)) {
            revert VotingSystem__InvalidAddress();
        }
        s_pollManager = IPollManager(pollManager);
        s_defaultVoteStorage = IVoteStorage(defaultVoteStorage);
        if (defaultEligibilityModule != address(0)) {
            s_defaultEligibility = IEligibilityModule(defaultEligibilityModule);
        }
        s_resultNFT = resultNFTAddress;
        s_initializationFlag = true;
    }

    function createPoll(
        string calldata title,
        string calldata description,
        string[] calldata options,
        bytes calldata voteStorageConfig,
        bytes calldata eligibilityConfig,
        address eligibilityModule,
        address voteStorage
    ) external returns (uint256 pollId) {
        if (bytes(title).length == 0) {
            revert VotingSystem__EmptyTitle();
        }

        if (options.length < 2) {
            revert VotingSystem__InvalidNumberOfOptions();
        }

        pollId = s_pollManager.createPoll(title, description, options, msg.sender);

        if (voteStorage == address(0)) {
            s_pollVoteStorage[pollId] = s_defaultVoteStorage;
        } else {
            s_pollVoteStorage[pollId] = IVoteStorage(voteStorage);
        }

        if (eligibilityModule == address(0)) {
            s_pollEligibility[pollId] = s_defaultEligibility;
        } else {
            s_pollEligibility[pollId] = IEligibilityModule(eligibilityModule);
        }

        s_pollVoteStorage[pollId].initPoll(pollId, voteStorageConfig);
        s_pollEligibility[pollId].initPoll(pollId, eligibilityConfig);

        return pollId;
    }

    // ============ Whitelist Management ============

    function whitelistUser(uint256 pollId, address user) external checkPollValidity(pollId) onlyWhenInState(pollId, 0) {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) revert VotingSystem__NotPollOwner();
        s_pollEligibility[pollId].addWhitelisted(pollId, user);
    }

    function whitelistUsers(uint256 pollId, address[] calldata users)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 0)
    {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_pollEligibility[pollId].addWhitelistedBatch(pollId, users);
    }

    function removeWhitelisted(uint256 pollId, address user)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 0)
    {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) {
            revert VotingSystem__NotPollOwner();
        }
        s_pollEligibility[pollId].removeWhitelisted(pollId, user);
    }

    function isWhitelisted(uint256 pollId, address user) external view checkPollValidity(pollId) returns (bool) {
        return s_pollEligibility[pollId].isWhitelisted(pollId, user);
    }

    // ============ Plain Voting ============

    function castVote(uint256 pollId, uint256 optionIdx)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
        returns (uint256 voteId)
    {
        address voter = msg.sender;
        if (!s_pollEligibility[pollId].isEligibleToVote(pollId, abi.encode(voter))) {
            revert VotingSystem__AddressNotWhitelisted(voter);
        }

        uint256 optionCount = s_pollManager.getPollOptionCount(pollId);
        if (optionIdx >= optionCount) {
            revert VotingSystem__InvalidOption();
        }

        voteId = s_pollVoteStorage[pollId].castVote(pollId, voter, abi.encode(optionIdx));
    }

    // ============ ZK Voting ============

    function registerVoter(uint256 pollId, uint256 identityCommitment)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 0)
    {
        if (!s_pollEligibility[pollId].isWhitelisted(pollId, msg.sender)) {
            revert VotingSystem__AddressNotWhitelisted(msg.sender);
        }
        ISemaphoreEligibilityModule(address(s_pollEligibility[pollId]))
            .registerIdentity(pollId, identityCommitment, msg.sender);
    }

    function castVoteWithProof(uint256 pollId, uint256 optionIdx, uint256 nullifierHash, uint256[8] calldata proof)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
        returns (uint256 voteId)
    {
        uint256 optionCount = s_pollManager.getPollOptionCount(pollId);
        if (optionIdx >= optionCount) {
            revert VotingSystem__InvalidOption();
        }

        ISemaphoreEligibilityModule(address(s_pollEligibility[pollId]))
            .verifyVote(pollId, optionIdx, nullifierHash, proof);

        address voter = address(uint160(nullifierHash));
        voteId = s_pollVoteStorage[pollId].castVote(pollId, voter, abi.encode(optionIdx));
    }

    function castEncryptedVoteWithProof(
        uint256 pollId,
        uint256 nullifierHash,
        uint256[8] calldata semaphoreProof,
        uint256[64] calldata encVote,
        ZKVoteLib.Proof calldata elgamalProof
    ) external checkPollValidity(pollId) onlyWhenInState(pollId, 1) returns (uint256 voteId) {
        // Since vote is encrypted, we use optionIdx=0 as placeholder
        ISemaphoreEligibilityModule(address(s_pollEligibility[pollId]))
            .verifyVote(pollId, 0, nullifierHash, semaphoreProof);

        address voter = address(uint160(nullifierHash));
        voteId = s_pollVoteStorage[pollId].castVote(pollId, voter, abi.encode(encVote, elgamalProof));

        emit EncryptedVoteCast(pollId, voter, voteId);
    }

    function castEncryptedVote(uint256 pollId, uint256[64] calldata encVote, ZKVoteLib.Proof calldata proof)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 1)
        returns (uint256 voteId)
    {
        address voter = msg.sender;
        if (!s_pollEligibility[pollId].isWhitelisted(pollId, voter)) {
            revert VotingSystem__AddressNotWhitelisted(voter);
        }
        voteId = s_pollVoteStorage[pollId].castVote(pollId, voter, abi.encode(encVote, proof));
        emit EncryptedVoteCast(pollId, voter, voteId);
    }

    function publishEncryptedResults(uint256 pollId, uint256[16] calldata tally, ZKVoteLib.Proof calldata tallyProof)
        external
        checkPollValidity(pollId)
        onlyWhenInState(pollId, 2)
    {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) revert VotingSystem__NotPollOwner();
        IZKElGamalVoteVector(address(s_pollVoteStorage[pollId])).publishResults(pollId, tally, tallyProof);
        emit EncryptedResultsPublished(pollId);
    }

    function getAggregatedCiphertexts(uint256 pollId)
        external
        view
        returns (uint256[2][16] memory c1, uint256[2][16] memory c2)
    {
        return IZKElGamalVoteVector(address(s_pollVoteStorage[pollId])).getAggregatedCiphertexts(pollId);
    }

    // ============ Poll State Management ============

    function startPoll(uint256 pollId) external checkPollValidity(pollId) onlyWhenInState(pollId, 0) {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) revert VotingSystem__NotPollOwner();
        s_pollManager.setState(pollId, 1);
    }

    function endPoll(uint256 pollId) external checkPollValidity(pollId) onlyWhenInState(pollId, 1) {
        if (msg.sender != s_pollManager.getPollOwner(pollId)) revert VotingSystem__NotPollOwner();
        s_pollManager.setState(pollId, 2);
    }

    // ============ NFT ============

    function mintResultNFT(uint256 pollId) external checkPollValidity(pollId) onlyWhenInState(pollId, 2) {
        if (s_resultNFT == address(0)) revert VotingSystem__NFTContractNotSet();

        address pollOwner = s_pollManager.getPollOwner(pollId);
        if (msg.sender != pollOwner && !s_pollEligibility[pollId].isWhitelisted(pollId, msg.sender)) {
            revert VotingSystem__NotAuthorizedToMint();
        }

        string memory title = s_pollManager.getPollTitle(pollId);
        string[] memory options = s_pollManager.getPollOptions(pollId);
        uint256[] memory results = s_pollVoteStorage[pollId].getResults(pollId, options.length);

        ResultNFT(s_resultNFT).mintResult(msg.sender, _constructTokenURI(pollId, title, options, results));
    }

    function _constructTokenURI(uint256 pollId, string memory title, string[] memory options, uint256[] memory results)
        internal
        pure
        returns (string memory)
    {
        string memory json = string.concat(
            '{"name": "Poll #',
            Strings.toString(pollId),
            ' Results",',
            '"description": "Results for poll: ',
            title,
            '",',
            '"attributes": ['
        );

        for (uint256 i = 0; i < options.length; i++) {
            json =
                string.concat(json, '{"trait_type": "', options[i], '", "value": ', Strings.toString(results[i]), "}");
            if (i < options.length - 1) json = string.concat(json, ",");
        }

        return string.concat("data:application/json;base64,", Base64.encode(bytes(string.concat(json, "]}"))));
    }
}
