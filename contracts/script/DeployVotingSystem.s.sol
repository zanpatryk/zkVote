// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script, console} from "forge-std/Script.sol";

import {VotingSystemEngine} from "../src/core/VotingSystemEngine.sol";
import {PollManager} from "../src/poll_management/PollManager.sol";
import {SemaphoreEligibilityModule} from "../src/eligibility/SemaphoreEligibilityModule.sol";
import {MockSemaphoreVerifier} from "../test/mocks/MockSemaphoreVerifier.sol";
import {VoteStorageV0} from "../src/vote_storage/VoteStorageV0.sol";
import {ResultNFT} from "../src/result_nft/ResultNFT.sol";

import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployVotingSystem is Script {
    /**
     * Deploy order:
     * 1) deploy VSE (VotingSystemEngine)
     * 2) deploy modules (PollManager, SemaphoreEligibility, VoteStorage) linked to VSE
     * 3) deploy ResultNFT
     * 4) grant MINTER_ROLE on ResultNFT to VSE
     * 5) initialize VSE with all module addresses
     */
    function run()
        external
        returns (
            VotingSystemEngine vse,
            PollManager pollManager,
            SemaphoreEligibilityModule eligibilityModule,
            VoteStorageV0 voteStorage,
            ResultNFT resultNFT, // Added to return tuple
            HelperConfig helper
        )
    {
        helper = new HelperConfig();
        (uint256 deployerKey) = helper.activeNetworkConfig();

        // Derive the deployer's address from the private key
        // We need this to set the initial admin of the NFT contract
        address deployerAddress = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1) Deploy VSE
        vse = new VotingSystemEngine();

        // 2) Deploy core modules
        //    (Assumes module constructors accept `address votingEngine` param)
        pollManager = new PollManager(address(vse));
        
        // Deploy Mock Verifier first
        MockSemaphoreVerifier verifier = new MockSemaphoreVerifier();
        
        // Deploy Semaphore Eligibility Module
        eligibilityModule = new SemaphoreEligibilityModule(verifier, address(vse));
        
        voteStorage = new VoteStorageV0(address(vse));

        // 3) Deploy ResultNFT
        //    Args: Name, Symbol, Admin (Deployer)
        resultNFT = new ResultNFT("VotingResult", "VRES", deployerAddress);

        // 4) Setup Permissions
        //    Grant MINTER_ROLE to the VSE contract so it can mint NFTs
        bytes32 minterRole = resultNFT.MINTER_ROLE();
        resultNFT.grantRole(minterRole, address(vse));

        // 5) Initialize VSE
        //    Now includes the ResultNFT address as the 4th argument
        vse.initialize(address(pollManager), address(eligibilityModule), address(voteStorage), address(resultNFT));

        // Write address to frontend
        string memory jsonBase = '{"address": "';
        string memory addrStr = vm.toString(address(vse));
        string memory jsonEnd = '"}';
        string memory finalJson = string.concat(jsonBase, addrStr, jsonEnd);
        vm.writeFile("../frontend/src/lib/contracts/address.json", finalJson);
        console.log("VSE Address written to frontend:", address(vse));

        vm.stopBroadcast();

        return (vse, pollManager, eligibilityModule, voteStorage, resultNFT, helper);
    }
}
