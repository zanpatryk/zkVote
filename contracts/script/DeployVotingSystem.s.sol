// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";

import {VotingSystemEngine} from "../src/core/VotingSystemEngine.sol";
import {PollManager} from "../src/poll_management/PollManager.sol";
import {SemaphoreEligibilityModule} from "../src/eligibility/SemaphoreEligibilityModule.sol";
import {EligibilityModuleV0} from "../src/eligibility/EligibilityModuleV0.sol";
import {SemaphoreVerifier} from "@semaphore-protocol/contracts/base/SemaphoreVerifier.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";
import {VoteStorageV0} from "../src/vote_storage/VoteStorageV0.sol";
import {ZKElGamalVoteVector} from "../src/vote_storage/ZKElGamalVoteVector.sol";
import {ResultNFT} from "../src/result_nft/ResultNFT.sol";

import {ElGamalVoteVectorVerifier_N16} from "zkvote-lib/ElGamalVoteVectorVerifier_N16.sol";
import {ElGamalTallyDecryptVerifier_N16} from "zkvote-lib/ElGamalTallyDecryptVerifier_N16.sol";

import {EntryPoint} from "@account-abstraction/contracts/core/EntryPoint.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {PollSponsorPaymaster} from "../src/account_abstraction/PollSponsorPaymaster.sol";

import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployVotingSystem is Script {
    function run()
        external
        returns (
            VotingSystemEngine vse,
            PollManager pollManager,
            SemaphoreEligibilityModule semaphoreEligibility,
            EligibilityModuleV0 eligibilityV0,
            VoteStorageV0 voteStorageV0,
            ZKElGamalVoteVector zkElGamalVoteVector,
            ResultNFT resultNFT,
            EntryPoint entryPoint,
            PollSponsorPaymaster pollSponsorPaymaster,
            HelperConfig helper,
            ISemaphoreVerifier verifierContract
        )
    {
        helper = new HelperConfig();
        (uint256 deployerKey, address semaphoreVerifierAddr) = helper.activeNetworkConfig();
        address deployerAddress = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1) Deploy Enigne
        vse = new VotingSystemEngine();

        // 2) Deploy core modules
        pollManager = new PollManager(address(vse));
        
        ISemaphoreVerifier verifier;
        if (semaphoreVerifierAddr != address(0)) {
            verifier = ISemaphoreVerifier(semaphoreVerifierAddr);
        } else {
            verifier = ISemaphoreVerifier(address(new SemaphoreVerifier()));
        }
        semaphoreEligibility = new SemaphoreEligibilityModule(verifier, address(vse));
        eligibilityV0 = new EligibilityModuleV0(address(vse));

        voteStorageV0 = new VoteStorageV0(address(vse));

        // Deploy ElGamal Verifiers
        ElGamalVoteVectorVerifier_N16 elgamalVoteVerifier = new ElGamalVoteVectorVerifier_N16();
        ElGamalTallyDecryptVerifier_N16 elgamalTallyVerifier = new ElGamalTallyDecryptVerifier_N16();

        zkElGamalVoteVector = new ZKElGamalVoteVector(address(pollManager));

        // 3) Deploy ResultNFT
        resultNFT = new ResultNFT("VotingResult", "VRES", deployerAddress);

        // 4) Permissions
        resultNFT.grantRole(resultNFT.MINTER_ROLE(), address(vse));
        zkElGamalVoteVector.transferOwnership(address(vse));

        // 5) Initialize VSE (Default Modules)
        vse.initialize(address(pollManager), address(eligibilityV0), address(voteStorageV0), address(resultNFT));

        // 6) Deploy Paymaster
        entryPoint = new EntryPoint();
        pollSponsorPaymaster = new PollSponsorPaymaster(entryPoint, address(pollManager), address(vse));

        // Write simplified address.json for frontend
        string memory json = string.concat(
            "{\n",
            '  "vse": "',
            vm.toString(address(vse)),
            '",\n',
            '  "pollManager": "',
            vm.toString(address(pollManager)),
            '",\n',
            '  "semaphoreEligibility": "',
            vm.toString(address(semaphoreEligibility)),
            '",\n',
            '  "semaphoreVerifier": "', vm.toString(address(verifier)), '",\n',
            '  "eligibilityV0": "',
            vm.toString(address(eligibilityV0)),
            '",\n',
            '  "voteStorageV0": "',
            vm.toString(address(voteStorageV0)),
            '",\n',
            '  "zkElGamalVoteVector": "',
            vm.toString(address(zkElGamalVoteVector)),
            '",\n',
            '  "elgamalVoteVerifier": "',
            vm.toString(address(elgamalVoteVerifier)),
            '",\n',
            '  "elgamalTallyVerifier": "',
            vm.toString(address(elgamalTallyVerifier)),
            '",\n',
            '  "entryPoint": "',
            vm.toString(address(entryPoint)),
            '",\n',
            '  "paymaster": "',
            vm.toString(address(pollSponsorPaymaster)),
            '"\n',
            "}"
        );
        vm.writeFile("../frontend/src/lib/contracts/address.json", json);

        vm.stopBroadcast();
    }
}
