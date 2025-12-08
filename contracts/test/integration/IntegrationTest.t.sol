// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {HelperConfig} from "../../script/HelperConfig.s.sol";
import {DeployVotingSystem} from "../../script/DeployVotingSystem.s.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {EligibilityModuleV0} from "../../src/eligibility/EligibilityModuleV0.sol";
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract IntegrationTest is Test {
    DeployVotingSystem deployer;
    HelperConfig helperConfig;
    VoteStorageV0 voteStorage;
    PollManager pollManager;
    EligibilityModuleV0 eligibilityModule;
    VotingSystemEngine vse;
    ResultNFT resultNFT;

    address private alice = address(1001);
    address private bob = address(1002);
    address private charlie = address(1003);
    string[] private options;

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

    function setUp() external {
        deployer = new DeployVotingSystem();
        (vse, pollManager, eligibilityModule, voteStorage, resultNFT, helperConfig) = deployer.run();
    }

    /* Helper functions */
    function _createPollAs(address creator) internal returns (uint256) {
        options.push("Yes");
        options.push("No");
        vm.prank(creator);
        uint256 pollId = vse.createPoll("Do you like tests?", "Simple description", options);
        return pollId;
    }

    /* Tests */
    function testCreatePollAndStart() external {
        uint256 pollId = _createPollAs(alice);

        assertEq(pollId, 1);
        assertEq(pollManager.getPollOwner(pollId), alice);
        assertEq(pollManager.getPollTitle(pollId), "Do you like tests?");
        assertEq(pollManager.getPollOptionCount(pollId), 2);

        assertEq(pollManager.getState(pollId), 0);

        vm.prank(alice);
        vse.startPoll(pollId);

        assertEq(pollManager.getState(pollId), 1);
    }

    function testWhitelistAndVote() external {
        uint256 pollId = _createPollAs(alice);

        vm.prank(alice);
        vse.startPoll(pollId);

        vm.prank(alice);
        vse.whitelistUser(pollId, bob);

        assertTrue(eligibilityModule.isWhitelisted(pollId, bob));

        vm.prank(bob);
        uint256 voteId = vse.castVote(pollId, 0);

        assertEq(voteId, 1);

        uint256 count0 = voteStorage.getVoteCount(pollId, 0);
        uint256 count1 = voteStorage.getVoteCount(pollId, 1);
        assertEq(count0, 1);
        assertEq(count1, 0);

        uint256[] memory results = voteStorage.getResults(pollId, 2);
        assertEq(results.length, 2);
        assertEq(results[0], 1);
        assertEq(results[1], 0);

        VoteStorageV0.Vote memory v = voteStorage.getVote(voteId);
        assertEq(v.voteId, voteId);
        assertEq(v.pollId, pollId);
        assertEq(v.optionIdx, 0);
        assertEq(v.voter, bob);
    }

    function testNonWhitelistedCannotVote() external {
        uint256 pollId = _createPollAs(alice);

        vm.prank(alice);
        vse.startPoll(pollId);

        bytes memory expectedRevert =
            abi.encodeWithSelector(bytes4(keccak256("VotingSystem__AddressNotWhitelisted(address)")), charlie);

        vm.prank(charlie);
        vm.expectRevert(expectedRevert);
        vse.castVote(pollId, 1);
    }

    function testDoubleVotingRevert() external {
        uint256 pollId = _createPollAs(alice);

        vm.prank(alice);
        vse.startPoll(pollId);

        vm.prank(alice);
        vse.whitelistUser(pollId, bob);

        vm.prank(bob);
        vse.castVote(pollId, 0);

        bytes memory expectedRevert =
            abi.encodeWithSelector(bytes4(keccak256("VoteStorageV0__AlreadyVoted(address)")), bob);

        vm.prank(bob);
        vm.expectRevert(expectedRevert);
        vse.castVote(pollId, 1);
    }

    function testInvalidOptionsRevert() external {
        string[] memory invalidOptions = new string[](1);
        invalidOptions[0] = "Only one option";

        bytes memory expectedRevert =
            abi.encodeWithSelector(bytes4(keccak256("VotingSystem__InvalidNumberOfOptions()")));

        vm.prank(alice);
        vm.expectRevert(expectedRevert);
        vse.createPoll("Invalid Poll", "This poll has only one option", invalidOptions);
    }

    function testCannotVoteAfterPollEnded() external {
        uint256 pollId = _createPollAs(alice);

        vm.prank(alice);
        vse.startPoll(pollId);

        vm.prank(alice);
        vse.whitelistUser(pollId, bob);

        vm.prank(bob);
        vse.castVote(pollId, 0);

        vm.prank(alice);
        vse.endPoll(pollId);

        assertEq(pollManager.getState(pollId), 2);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(VotingSystem__InvalidPollState.selector));
        vse.castVote(pollId, 0);
    }

    function testBatchWhitelistAndRemove() external {
        uint256 pollId = _createPollAs(alice);

        vm.prank(alice);
        vse.startPoll(pollId);

        address[] memory users = new address[](2);
        users[0] = bob;
        users[1] = charlie;

        vm.prank(alice);
        vse.whitelistUsers(pollId, users);

        assertTrue(eligibilityModule.isWhitelisted(pollId, bob));
        assertTrue(eligibilityModule.isWhitelisted(pollId, charlie));

        vm.prank(alice);
        vse.removeWhitelisted(pollId, bob);

        assertFalse(eligibilityModule.isWhitelisted(pollId, bob));
        assertTrue(eligibilityModule.isWhitelisted(pollId, charlie));

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(VotingSystem__AddressNotWhitelisted.selector, bob));
        vse.castVote(pollId, 0);

        vm.prank(charlie);
        uint256 voteId = vse.castVote(pollId, 1);
        assertEq(voteId, 1);
    }

    function testRevertMintResultNFT() external {
        uint256 pollId = _createPollAs(alice);

        vm.prank(alice);
        vse.startPoll(pollId);

        vm.prank(alice);
        vse.whitelistUser(pollId, bob);

        vm.prank(bob);
        vse.castVote(pollId, 0); // Bob votes "Yes"

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(VotingSystem__InvalidPollState.selector));
        vse.mintResultNFT(pollId);

        vm.prank(alice);
        vse.endPoll(pollId);

        vm.prank(charlie);
        vm.expectRevert(abi.encodeWithSelector(VotingSystem__NotAuthorizedToMint.selector));
        vse.mintResultNFT(pollId);
    }

    function testMintResultNFTAndVerifyMetadata() external {
        uint256 pollId = _createPollAs(alice);
        vm.prank(alice);
        vse.startPoll(pollId);
        vm.prank(alice);
        vse.whitelistUser(pollId, bob);

        vm.prank(bob);
        vse.castVote(pollId, 0);

        vm.prank(alice);
        vse.endPoll(pollId);

        vm.prank(bob);
        vse.mintResultNFT(pollId);

        string memory actualURI = resultNFT.tokenURI(1);
        console.log("Actual URI:", actualURI);

        string[] memory opts = new string[](2);
        opts[0] = "Yes";
        opts[1] = "No";

        uint256[] memory res = new uint256[](2);
        res[0] = 1; // 1 vote for Yes
        res[1] = 0; // 0 votes for No

        string memory expectedURI = _constructExpectedURI(pollId, "Do you like tests?", opts, res);

        assertEq(actualURI, expectedURI, "Metadata does not match actual votes");
    }

    /**
     * @dev Helper to replicate the logic inside VSE for verification.
     * This ensures the JSON structure and Base64 encoding are correct.
     */
    function _constructExpectedURI(uint256 pollId, string memory title, string[] memory opts, uint256[] memory res)
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

        for (uint256 i = 0; i < opts.length; i++) {
            json = string.concat(json, '{"trait_type": "', opts[i], '", "value": ', Strings.toString(res[i]), "}");

            if (i < opts.length - 1) {
                json = string.concat(json, ",");
            }
        }

        json = string.concat(json, "]}");

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}

