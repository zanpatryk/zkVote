// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GasMeter, BenchmarkBase, BenchmarkActor} from "./BenchmarkUtils.sol";

// Contracts
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {ZKElGamalVoteVector} from "../../src/vote_storage/ZKElGamalVoteVector.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {EligibilityModuleV0} from "../../src/eligibility/EligibilityModuleV0.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";

// Interfaces
import {IVoteStorage} from "../../src/interfaces/IVoteStorage.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

// Libs
import "zkvote-lib/ZKVoteLib.sol";

import {MockVoteVerifier} from "../../test/mocks/MockVoteVerifier.sol";
import {MockTallyVerifier} from "../../test/mocks/MockTallyVerifier.sol";

contract ZKVoteBenchmark is BenchmarkBase {

    uint256 constant N = 16;
    
    function buildMockEncVote(uint256 selectedOption) internal pure returns (uint256[64] memory encVote) {
        uint256 base = selectedOption * 4;
        encVote[base] = 1; encVote[base + 1] = 2; encVote[base + 2] = 3; encVote[base + 3] = 4;
    }
    
    function buildMockProof() internal pure returns (ZKVoteLib.Proof memory proof) {
        proof.a = [uint256(1), uint256(2)];
        proof.b = [[uint256(3), uint256(4)], [uint256(5), uint256(6)]];
        proof.c = [uint256(7), uint256(8)];
    }

    struct SystemContext {
        EligibilityModuleV0 eligibility;
        ResultNFT resultNFT;
        ZKElGamalVoteVector zkStorage;
        MockVoteVerifier voteV;
        MockTallyVerifier tallyV;
    }

    SystemContext public localSys;

    function loadConfig() internal {
        loadBaseConfig();
        baseCfg.testSuffix = "zk";
    }

    function deploySystem() internal {
        gasMeter = new GasMeter();
        localSys.voteV = new MockVoteVerifier();
        localSys.tallyV = new MockTallyVerifier();
        
        sys.vse = new VotingSystemEngine();
        sys.pollManager = new PollManager(address(sys.vse));
        localSys.eligibility = new EligibilityModuleV0(address(sys.vse));
        localSys.resultNFT = new ResultNFT("Mock", "MCK", baseCfg.deployer);
        localSys.resultNFT.grantRole(localSys.resultNFT.MINTER_ROLE(), address(sys.vse));
        
        localSys.zkStorage = new ZKElGamalVoteVector(address(sys.pollManager));
        sys.voteStorageAddr = address(localSys.zkStorage);
        sys.eligibilityAddr = address(localSys.eligibility);
        
        // Transfer ownership before init
        localSys.zkStorage.transferOwnership(address(sys.vse));
        
        sys.vse.initialize(address(sys.pollManager), sys.eligibilityAddr, sys.voteStorageAddr, address(localSys.resultNFT));
        
        sys.ownerActor = new BenchmarkActor(address(sys.vse));
        sys.voterActors = createActors(baseCfg.participants, address(sys.vse));
    }

    function createPoll() internal override returns (uint256 pollId) {
        string[] memory options = new string[](2); options[0] = "A"; options[1] = "B";
        bytes memory voteStorageConfig = abi.encode([uint256(123), 456], address(localSys.voteV), address(localSys.tallyV));
        bytes memory createData = abi.encodeCall(BenchmarkActor.createPoll, ("ZK Benchmark", "Desc", options, voteStorageConfig, "", address(0), sys.voteStorageAddr));
        (uint256 gasCreate, bytes memory retCreate) = gasMeter.measureCall(address(sys.ownerActor), createData);
        pollId = abi.decode(retCreate, (uint256));
        results.gas_create = gasCreate;
        results.totalGas += gasCreate;
    }
    
    function votingPhase(uint256 pollId) internal {
        uint256 count = baseCfg.participants;
        results.voteGases = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            uint256 option = i % N;
            uint256[64] memory encVote = buildMockEncVote(option);
            ZKVoteLib.Proof memory proof = buildMockProof();
            bytes memory voteData = abi.encodeCall(BenchmarkActor.castEncryptedVote, (pollId, encVote, proof));
            (uint256 g, ) = gasMeter.measureCall(address(sys.voterActors[i]), voteData);
            results.voteGases[i] = g;
            results.totalGas += g;
        }
    }
    
    function publishResults(uint256 pollId) internal {
        uint256 count = baseCfg.participants;
        uint256[16] memory tally;
        for (uint256 i = 0; i < N; ++i) tally[i] = count / N + (i < count % N ? 1 : 0);
        bytes memory pubData = abi.encodeCall(BenchmarkActor.publishEncryptedResults, (pollId, tally, buildMockProof()));
        (uint256 gasPublish, ) = gasMeter.measureCall(address(sys.ownerActor), pubData);
        results.gas_publish = gasPublish;
        results.totalGas += gasPublish;
    }
    
    function run() external {
        loadConfig();
        vm.startBroadcast(baseCfg.deployerKey);
        deploySystem();
        uint256 pollId = createPoll();
        
        whitelistParticipants(pollId);
        
        startPoll(pollId);
        votingPhase(pollId);
        endPoll(pollId);
        publishResults(pollId);
        vm.stopBroadcast();
        
        // --- Output ---
        string memory outPath = getOutPath(baseCfg.testSuffix);
        writeJSONHeader(outPath, baseCfg.testSuffix, baseCfg.participants);
        writeJSONStep(outPath, "create_poll", results.gas_create);
        writeWhitelistStats(outPath);
        writeJSONStep(outPath, "start_poll", results.gas_start);
        writeVoteStats(outPath, baseCfg.participants, results.voteGases);
        writeJSONStep(outPath, "end_poll", results.gas_end);
        writeJSONStepNoComma(outPath, "publish_results", results.gas_publish);

        uint256 whitelistTxs = baseCfg.batchUpload ? 1 : baseCfg.participants;
        uint256 txCount = 5 + whitelistTxs + baseCfg.participants;
        writeJSONFooter(outPath, txCount, results.totalGas, baseCfg.gasCostPerGwei, baseCfg.ethUsdRate);
    }
}
