// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";

// adjust these import paths to match your repo layout
import {VotingSystemEngine} from "../src/core/VotingSystemEngine.sol";
import {PollManager} from "../src/poll_management/PollManager.sol";
import {EligibilityModuleV0} from "../src/eligibility/EligibilityModuleV0.sol";
import {VoteStorageV0} from "../src/vote_storage/VoteStorageV0.sol";

import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployVotingSystem is Script {
    /**
     * Deploy order:
     * 1) deploy VSE (VotingSystemEngine) to get its address
     * 2) deploy modules with VSE address as constructor arg (i_owner)
     * 3) call vse.initialize(pollManager, eligibility, voteStorage) as deployer (VSE owner)
     */
    function run()
        external
        returns (
            VotingSystemEngine vse,
            PollManager pollManager,
            EligibilityModuleV0 eligibilityModule,
            VoteStorageV0 voteStorage,
            HelperConfig helper
        )
    {
        helper = new HelperConfig();
        (uint256 deployerKey) = helper.activeNetworkConfig();

        vm.startBroadcast(deployerKey);

        // 1) deploy VSE
        vse = new VotingSystemEngine();

        // 2) deploy modules passing VSE address so modules accept calls only from VSE
        //    (assumes module constructors accept an address votingEngine param)
        pollManager = new PollManager(address(vse));
        eligibilityModule = new EligibilityModuleV0(address(vse));
        voteStorage = new VoteStorageV0(address(vse));

        // 3) initialize VSE with module addresses (onlyVSE.owner/deployer will call)
        //    initialize should be protected (onlyOwner) and guard against reinitialization
        vse.initialize(address(pollManager), address(eligibilityModule), address(voteStorage));

        vm.stopBroadcast();

        return (vse, pollManager, eligibilityModule, voteStorage, helper);
    }
}
