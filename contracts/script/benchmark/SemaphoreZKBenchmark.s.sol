// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {GasMeter, BenchmarkBase, BenchmarkActor} from "./BenchmarkUtils.sol";

// Contracts
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {ZKElGamalVoteVector} from "../../src/vote_storage/ZKElGamalVoteVector.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {SemaphoreEligibilityModule} from "../../src/eligibility/SemaphoreEligibilityModule.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";
import {MockSemaphoreVerifier} from "../../test/mocks/MockSemaphoreVerifier.sol";
import {MockVoteVerifier} from "../../test/mocks/MockVoteVerifier.sol";
import {MockTallyVerifier} from "../../test/mocks/MockTallyVerifier.sol";

// Interfaces
import {IVoteStorage} from "../../src/interfaces/IVoteStorage.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

// Libs
import "zkvote-lib/ZKVoteLib.sol";

contract SemaphoreZKBenchmark is BenchmarkBase {
    struct SystemContext {
        SemaphoreEligibilityModule eligibility;
        ResultNFT resultNFT;
        ZKElGamalVoteVector zkStorage;
        MockSemaphoreVerifier mockSemVerifier;
        MockVoteVerifier voteV;
        MockTallyVerifier tallyV;
    }

    SystemContext public localSys;

    function loadConfig() internal {
        loadBaseConfig();
        baseCfg.testSuffix = "semaphore_zk";
    }

    function deploySystem() internal {
        gasMeter = new GasMeter();
        localSys.mockSemVerifier = new MockSemaphoreVerifier();
        localSys.voteV = new MockVoteVerifier();
        localSys.tallyV = new MockTallyVerifier();

        sys.vse = new VotingSystemEngine();
        sys.pollManager = new PollManager(address(sys.vse));
        localSys.eligibility =
            new SemaphoreEligibilityModule(ISemaphoreVerifier(address(localSys.mockSemVerifier)), address(sys.vse));
        localSys.resultNFT = new ResultNFT("Mock", "MCK", baseCfg.deployer);
        localSys.resultNFT.grantRole(localSys.resultNFT.MINTER_ROLE(), address(sys.vse));

        localSys.zkStorage = new ZKElGamalVoteVector(address(sys.pollManager));
        sys.voteStorageAddr = address(localSys.zkStorage);
        sys.eligibilityAddr = address(localSys.eligibility);

        // Transfer ownership before init so VSE can call initPoll
        localSys.zkStorage.transferOwnership(address(sys.vse));

        sys.vse
            .initialize(address(sys.pollManager), sys.eligibilityAddr, sys.voteStorageAddr, address(localSys.resultNFT));

        sys.ownerActor = new BenchmarkActor(address(sys.vse));
        sys.voterActors = createActors(baseCfg.participants, address(sys.vse));
    }

    function createPoll() internal override returns (uint256 pollId) {
        string[] memory options = new string[](2);
        options[0] = "A";
        options[1] = "B";
        bytes memory eligConfig = "";
        bytes memory voteStorageConfig = abi.encode([uint256(1), 2], address(localSys.voteV), address(localSys.tallyV));
        bytes memory createData = abi.encodeCall(
            BenchmarkActor.createPoll,
            ("Benchmark", "Desc", options, voteStorageConfig, eligConfig, address(0), sys.voteStorageAddr)
        );
        (uint256 gasCreate, bytes memory retCreate) = gasMeter.measureCall(address(sys.ownerActor), createData);
        pollId = abi.decode(retCreate, (uint256));
        results.gas_create = gasCreate;
        results.totalGas += gasCreate;
    }

    function registerPhase(uint256 pollId) internal returns (uint256[] memory registerGases) {
        uint256 count = baseCfg.participants;
        registerGases = new uint256[](count);
        uint256 SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        for (uint256 i = 0; i < count; ++i) {
            uint256 identityCommitment = uint256(keccak256(abi.encode("identity", i))) % SNARK_SCALAR_FIELD;
            uint256 gReg = sys.voterActors[i].registerVoter(pollId, identityCommitment);
            registerGases[i] = gReg;
            results.totalGas += gReg;
        }
    }

    function castVotes(uint256 pollId) internal {
        uint256 count = baseCfg.participants;
        results.voteGases = new uint256[](count);
        for (uint256 i = 0; i < count; ++i) {
            uint256 nullifier = uint256(keccak256(abi.encode("nullifier", i)));
            uint256[8] memory semProof;
            uint256[64] memory encVote;
            ZKVoteLib.Proof memory zkProof;
            zkProof.a[0] = 1;
            uint256 g = sys.voterActors[i].castEncryptedVoteWithProof(pollId, nullifier, semProof, encVote, zkProof);
            results.voteGases[i] = g;
            results.totalGas += g;
        }
    }

    function publishResults(uint256 pollId) internal {
        uint256[16] memory tally;
        ZKVoteLib.Proof memory tallyProof;
        bytes memory pubData = abi.encodeCall(BenchmarkActor.publishEncryptedResults, (pollId, tally, tallyProof));
        (uint256 gasPublish,) = gasMeter.measureCall(address(sys.ownerActor), pubData);
        results.gas_publish = gasPublish;
        results.totalGas += gasPublish;
    }

    function run() external {
        loadConfig();
        vm.startBroadcast(baseCfg.deployerKey);
        deploySystem();
        uint256 pollId = createPoll();

        whitelistParticipants(pollId);

        uint256[] memory registerGases = registerPhase(pollId);
        startPoll(pollId);
        castVotes(pollId);
        endPoll(pollId);
        publishResults(pollId);
        vm.stopBroadcast();

        // --- Output ---
        string memory outPath = getOutPath(baseCfg.testSuffix);
        writeJSONHeader(outPath, baseCfg.testSuffix, baseCfg.participants);
        writeJSONStep(outPath, "create_poll", results.gas_create);
        writeWhitelistStats(outPath);
        writeJSONStepWithStats(outPath, "register_voters", baseCfg.participants, registerGases);
        writeJSONStep(outPath, "start_poll", results.gas_start);
        writeVoteStats(outPath, baseCfg.participants, results.voteGases);
        writeJSONStep(outPath, "end_poll", results.gas_end);
        writeJSONStepNoComma(outPath, "publish_results", results.gas_publish);

        uint256 whitelistTxs = baseCfg.batchUpload ? 1 : baseCfg.participants;
        uint256 txCount = 6 + whitelistTxs + 3 * baseCfg.participants;
        writeJSONFooter(outPath, txCount, results.totalGas, baseCfg.gasCostPerGwei, baseCfg.ethUsdRate);
    }
}
