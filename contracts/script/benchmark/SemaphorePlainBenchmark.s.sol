// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GasMeter, BenchmarkBase, BenchmarkActor} from "./BenchmarkUtils.sol";

// Contracts
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {VoteStorageV0} from "../../src/vote_storage/VoteStorageV0.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import {SemaphoreEligibilityModule} from "../../src/eligibility/SemaphoreEligibilityModule.sol";
import {ResultNFT} from "../../src/result_nft/ResultNFT.sol";
import {MockSemaphoreVerifier} from "../../test/mocks/MockSemaphoreVerifier.sol";

// Interfaces
import {IVoteStorage} from "../../src/interfaces/IVoteStorage.sol";
import {ISemaphoreVerifier} from "@semaphore-protocol/contracts/interfaces/ISemaphoreVerifier.sol";

contract SemaphorePlainBenchmark is BenchmarkBase {

    struct SystemContext {
        SemaphoreEligibilityModule eligibility;
        ResultNFT resultNFT;
        VoteStorageV0 plainStorage;
        MockSemaphoreVerifier mockSemVerifier;
    }
    
    SystemContext public localSys;

    function loadConfig() internal {
        loadBaseConfig();
        baseCfg.testSuffix = "semaphore_plain";
    }

    function deploySystem() internal {
        gasMeter = new GasMeter();
        localSys.mockSemVerifier = new MockSemaphoreVerifier();
        
        sys.vse = new VotingSystemEngine();
        sys.pollManager = new PollManager(address(sys.vse));
        localSys.eligibility = new SemaphoreEligibilityModule(ISemaphoreVerifier(address(localSys.mockSemVerifier)), address(sys.vse));
        localSys.resultNFT = new ResultNFT("Mock", "MCK", baseCfg.deployer);
        localSys.resultNFT.grantRole(localSys.resultNFT.MINTER_ROLE(), address(sys.vse));
        
        localSys.plainStorage = new VoteStorageV0(address(sys.vse));
        sys.voteStorageAddr = address(localSys.plainStorage);
        sys.eligibilityAddr = address(localSys.eligibility);
        
        sys.vse.initialize(address(sys.pollManager), sys.eligibilityAddr, sys.voteStorageAddr, address(localSys.resultNFT));
        
        sys.ownerActor = new BenchmarkActor(address(sys.vse));
        sys.voterActors = createActors(baseCfg.participants, address(sys.vse));
    }

    function createPoll() internal override returns (uint256 pollId) {
        string[] memory options = new string[](2);
        options[0] = "A";
        options[1] = "B";
        bytes memory createData = abi.encodeCall(BenchmarkActor.createPoll, ("Benchmark", "Desc", options, "", "", address(0), sys.voteStorageAddr));
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
            uint256[8] memory proof; 
            uint256 nullifier = uint256(keccak256(abi.encode("nullifier", i)));
            uint256 g = sys.voterActors[i].castVoteWithProof(pollId, i % 2, nullifier, proof);
            results.voteGases[i] = g;
            results.totalGas += g;
        }
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
        vm.stopBroadcast();
        
        // --- Output ---
        string memory outPath = getOutPath(baseCfg.testSuffix);
        writeJSONHeader(outPath, baseCfg.testSuffix, baseCfg.participants);
        writeJSONStep(outPath, "create_poll", results.gas_create);
        writeWhitelistStats(outPath);
        writeJSONStepWithStats(outPath, "register_voters", baseCfg.participants, registerGases);
        writeJSONStep(outPath, "start_poll", results.gas_start);
        writeVoteStats(outPath, baseCfg.participants, results.voteGases);
        writeJSONStepNoComma(outPath, "end_poll", results.gas_end);

        uint256 whitelistTxs = baseCfg.batchUpload ? 1 : baseCfg.participants;
        uint256 txCount = 4 + whitelistTxs + 2 * baseCfg.participants;
        writeJSONFooter(outPath, txCount, results.totalGas, baseCfg.gasCostPerGwei, baseCfg.ethUsdRate);
    }
}
