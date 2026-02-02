// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {GasMeter, BenchmarkBase, BenchmarkActor} from "./BenchmarkUtils.sol";

// Contracts
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {EligibilityModuleV0} from "../../src/eligibility/EligibilityModuleV0.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";

contract PlainBenchmark is BenchmarkBase {
    struct SystemContext {
        EligibilityModuleV0 eligibility;
        ResultNFT resultNFT;
        VoteStorageV0 plainStorage;
    }

    SystemContext public localSys;

    function loadConfig() internal {
        loadBaseConfig();
        baseCfg.testSuffix = "plain";
    }

    function run() external {
        loadConfig();
        vm.startBroadcast(baseCfg.deployerKey);
        deploySystem();

        uint256 pollId = createPoll();
        whitelistParticipants(pollId);
        startPoll(pollId);
        results.voteGases = castVotes(pollId);
        endPoll(pollId);
        vm.stopBroadcast();

        // --- Stats & Output ---
        string memory outPath = getOutPath(baseCfg.testSuffix);
        writeJSONHeader(outPath, baseCfg.testSuffix, baseCfg.participants);
        writeJSONStep(outPath, "create_poll", results.gas_create);
        writeWhitelistStats(outPath);
        writeJSONStep(outPath, "start_poll", results.gas_start);
        writeVoteStats(outPath, baseCfg.participants, results.voteGases);
        writeJSONStepNoComma(outPath, "end_poll", results.gas_end);
        uint256 whitelistTxs = baseCfg.batchUpload ? 1 : baseCfg.participants;
        uint256 txCount = 3 + whitelistTxs + baseCfg.participants;
        writeJSONFooter(outPath, txCount, results.totalGas, baseCfg.gasCostPerGwei, baseCfg.ethUsdRate);
    }

    function deploySystem() internal {
        gasMeter = new GasMeter();

        sys.vse = new VotingSystemEngine();
        sys.pollManager = new PollManager(address(sys.vse));
        localSys.eligibility = new EligibilityModuleV0(address(sys.vse));
        localSys.resultNFT = new ResultNFT("Mock", "MCK", baseCfg.deployer);
        localSys.resultNFT.grantRole(localSys.resultNFT.MINTER_ROLE(), address(sys.vse));

        localSys.plainStorage = new VoteStorageV0(address(sys.vse));
        sys.voteStorageAddr = address(localSys.plainStorage);
        sys.eligibilityAddr = address(localSys.eligibility);

        sys.vse
            .initialize(address(sys.pollManager), sys.eligibilityAddr, sys.voteStorageAddr, address(localSys.resultNFT));

        sys.ownerActor = new BenchmarkActor(address(sys.vse));
        sys.voterActors = createActors(baseCfg.participants, address(sys.vse));
    }

    function castVotes(uint256 pollId) internal returns (uint256[] memory voteGases) {
        uint256 count = baseCfg.participants;
        voteGases = new uint256[](count);
        uint256 sumVotes = 0;
        for (uint256 i = 0; i < count; ++i) {
            uint256 optionIdx = i % 2;
            bytes memory voteData = abi.encodeWithSelector(BenchmarkActor.vote.selector, pollId, optionIdx);
            (uint256 gVote,) = gasMeter.measureCall(address(sys.voterActors[i]), voteData);
            voteGases[i] = gVote;
            sumVotes += gVote;
        }
        results.totalGas += sumVotes;
    }
}
