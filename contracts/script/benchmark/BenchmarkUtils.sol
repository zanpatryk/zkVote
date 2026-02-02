// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/StdJson.sol";

import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";
import {PollManager} from "../../src/poll_management/PollManager.sol";
import "zkvote-lib/ZKVoteLib.sol";

contract GasMeter {
    function measureCall(address target, bytes calldata data)
        external
        returns (uint256 gasUsed, bytes memory returnData)
    {
        uint256 g0 = gasleft();
        (bool ok, bytes memory ret) = target.call(data);
        uint256 g1 = gasleft();
        require(ok, "call failed: call to target reverted");
        return (g0 - g1, ret);
    }
}

// Common system context

abstract contract BenchmarkBase is Script {
    using stdJson for string;
    uint256 constant PRECISION = 1_000_000;

    struct BaseSystemContext {
        VotingSystemEngine vse;
        PollManager pollManager;
        address eligibilityAddr;
        address voteStorageAddr;
        BenchmarkActor ownerActor;
        BenchmarkActor[] voterActors;
    }

    BaseResults public results;
    GasMeter public gasMeter;
    BaseSystemContext public sys;
    BaseConfig public baseCfg;

    struct BaseConfig {
        uint256 participants;
        uint256 gasCostPerGwei;
        uint256 ethUsdRate;
        uint256 deployerKey;
        address deployer;
        string testSuffix;
        bool batchUpload;
    }

    struct BaseResults {
        uint256 gas_create;
        uint256 gas_whitelist;
        uint256 gas_register;
        uint256 gas_start;
        uint256 gas_end;
        uint256 gas_publish;
        uint256 totalGas;
        uint256[] voteGases;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) digits++;
        temp /= 10;
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function loadBaseConfig() internal returns (BaseConfig memory _c) {
        string memory configRaw = vm.readFile("script/benchmark/BenchmarkConfig.json");
        _c.participants = vm.parseJsonUint(configRaw, ".participants");

        string memory gasCostStr = abi.decode(vm.parseJson(configRaw, ".gasCostPerGwei"), (string));
        _c.gasCostPerGwei = parseDecimalStringToUint(gasCostStr, PRECISION);

        string memory ethUsdStr = abi.decode(vm.parseJson(configRaw, ".ethUsdRate"), (string));
        _c.ethUsdRate = parseDecimalStringToUint(ethUsdStr, PRECISION);

        _c.deployerKey = vm.envUint("PRIVATE_KEY");
        _c.deployer = vm.addr(_c.deployerKey);
        _c.batchUpload = abi.decode(vm.parseJson(configRaw, ".batchUpload"), (bool));
        baseCfg = _c; // Set contract member
    }

    function createActors(uint256 count, address vse) internal returns (BenchmarkActor[] memory) {
        BenchmarkActor[] memory actors = new BenchmarkActor[](count);
        for (uint256 i = 0; i < count; ++i) {
            actors[i] = new BenchmarkActor(vse);
        }
        return actors;
    }

    function createBenchmarkActors(uint256 count, address vse) internal returns (BenchmarkActor[] memory) {
        BenchmarkActor[] memory actors = new BenchmarkActor[](count);
        for (uint256 i = 0; i < count; ++i) {
            actors[i] = new BenchmarkActor(vse);
        }
        return actors;
    }

    // --- Default Implementations ---

    function createPoll() internal virtual returns (uint256 pollId) {
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";

        bytes memory createData = abi.encodeCall(
            BenchmarkActor.createPlainPoll,
            ("Benchmark Poll", "Benchmark description", options, sys.eligibilityAddr, sys.voteStorageAddr)
        );

        (uint256 g, bytes memory ret) = gasMeter.measureCall(address(sys.ownerActor), createData);
        results.gas_create = g;
        results.totalGas += g;
        return abi.decode(ret, (uint256));
    }

    function whitelistParticipants(uint256 pollId) internal virtual returns (uint256[] memory whitelistGases) {
        if (baseCfg.batchUpload) {
            address[] memory voterAddrs = new address[](baseCfg.participants);
            for (uint256 i = 0; i < baseCfg.participants; ++i) {
                voterAddrs[i] = address(sys.voterActors[i]);
            }
            bytes memory batchData = abi.encodeCall(BenchmarkActor.whitelistUsers, (pollId, voterAddrs));
            (uint256 g,) = gasMeter.measureCall(address(sys.ownerActor), batchData);
            results.gas_whitelist = g;
            results.totalGas += g;
            whitelistGases = new uint256[](baseCfg.participants);
        } else {
            whitelistGases = new uint256[](baseCfg.participants);
            uint256 gasUsed = 0;
            for (uint256 i = 0; i < baseCfg.participants; ++i) {
                bytes memory singleData =
                    abi.encodeCall(BenchmarkActor.whitelistUser, (pollId, address(sys.voterActors[i])));
                (uint256 g,) = gasMeter.measureCall(address(sys.ownerActor), singleData);
                whitelistGases[i] = g;
                gasUsed += g;
            }
            results.gas_whitelist = gasUsed;
            results.totalGas += gasUsed;
        }
    }

    function startPoll(uint256 pollId) internal virtual {
        bytes memory startData = abi.encodeCall(BenchmarkActor.startPoll, (pollId));
        (uint256 g,) = gasMeter.measureCall(address(sys.ownerActor), startData);
        results.gas_start = g;
        results.totalGas += g;
    }

    function endPoll(uint256 pollId) internal virtual {
        bytes memory endData = abi.encodeCall(BenchmarkActor.endPoll, (pollId));
        (uint256 g,) = gasMeter.measureCall(address(sys.ownerActor), endData);
        results.gas_end = g;
        results.totalGas += g;
    }

    function computeStats(uint256[] memory arr)
        internal
        pure
        returns (uint256 minVal, uint256 maxVal, uint256 sum, uint256 median, uint256 p90)
    {
        uint256 n = arr.length;
        if (n == 0) return (0, 0, 0, 0, 0);

        minVal = arr[0];
        maxVal = arr[0];
        sum = 0;
        for (uint256 i = 0; i < n; ++i) {
            uint256 v = arr[i];
            sum += v;
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
        }

        uint256[] memory copy = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) {
            copy[i] = arr[i];
        }

        // Simple insertion sort
        for (uint256 i = 1; i < n; ++i) {
            uint256 key = copy[i];
            uint256 j = i;
            while (j > 0 && copy[j - 1] > key) {
                copy[j] = copy[j - 1];
                j--;
            }
            copy[j] = key;
        }

        median = n % 2 == 1 ? copy[n / 2] : (copy[n / 2 - 1] + copy[n / 2]) / 2;

        uint256 idx = (9 * n + 9) / 10;
        if (idx == 0) idx = 1;
        if (idx > n) idx = n;
        p90 = copy[idx - 1];
    }

    function parseDecimalStringToUint(string memory s, uint256 precision) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 i = 0;
        while (i < b.length && (b[i] == 0x20 || b[i] == 0x09 || b[i] == 0x0A || b[i] == 0x0D)) i++;

        uint256 intPart = 0;
        while (i < b.length && b[i] >= 0x30 && b[i] <= 0x39) {
            intPart = intPart * 10 + (uint8(b[i]) - 48);
            i++;
        }

        uint256 scaled = intPart * precision;

        if (i < b.length && b[i] == 0x2E) {
            i++;
            uint256 factor = precision / 10;
            while (i < b.length && b[i] >= 0x30 && b[i] <= 0x39 && factor > 0) {
                scaled += (uint8(b[i]) - 48) * factor;
                factor = factor / 10;
                i++;
            }
        }
        return scaled;
    }

    function scaledUintToDecimalString(uint256 scaled, uint256 precision) internal pure returns (string memory) {
        uint256 intPart = scaled / precision;
        uint256 frac = scaled % precision;

        string memory intStr = toString(intPart);
        uint256 prec = precision;
        uint256 digits = 0;
        while (prec > 1) {
            prec /= 10;
            digits++;
        }

        if (digits == 0) return intStr;

        bytes memory fracBuf = new bytes(digits);
        for (uint256 i = 0; i < digits; ++i) {
            uint256 d = frac % 10;
            fracBuf[digits - 1 - i] = bytes1(uint8(48 + d));
            frac /= 10;
        }
        return string(abi.encodePacked(intStr, ".", string(fracBuf)));
    }

    // --- Common Reporting Functions ---

    function getOutPath(string memory testSuffix) internal pure returns (string memory) {
        return string(abi.encodePacked("script/benchmark/results/run_", testSuffix, ".json"));
    }

    function writeJSONHeader(string memory outPath, string memory testSuffix, uint256 participants) internal {
        string memory jsonHeader = string(
            abi.encodePacked(
                "{\n",
                '  "run": "',
                testSuffix,
                '",\n',
                '  "timestamp": ',
                toString(block.timestamp),
                ",\n",
                '  "config": {\n',
                '    "participants": ',
                toString(participants),
                "\n",
                "  },\n",
                '  "steps": [\n'
            )
        );
        vm.writeFile(outPath, jsonHeader);
    }

    function writeJSONHeaderExtended(
        string memory outPath,
        string memory testSuffix,
        uint256 participants,
        string memory extraConfig
    ) internal {
        string memory jsonHeader = string(
            abi.encodePacked(
                "{\n",
                '  "run": "',
                testSuffix,
                '",\n',
                '  "timestamp": ',
                toString(block.timestamp),
                ",\n",
                '  "config": {\n',
                '    "participants": ',
                toString(participants),
                ",\n",
                extraConfig,
                "\n  },\n",
                '  "steps": [\n'
            )
        );
        vm.writeFile(outPath, jsonHeader);
    }

    function writeJSONStep(string memory outPath, string memory name, uint256 gas) internal {
        vm.writeLine(outPath, string(abi.encodePacked('    { "name": "', name, '", "gas": ', toString(gas), " },\n")));
    }

    function writeWhitelistStats(string memory outPath) internal {
        vm.writeLine(
            outPath,
            string(
                abi.encodePacked(
                    '    { "name": "whitelist", "batchUpload": ',
                    (baseCfg.batchUpload ? "true" : "false"),
                    ', "gas_total": ',
                    toString(results.gas_whitelist),
                    " },\n"
                )
            )
        );
    }

    function writeJSONStepNoComma(string memory outPath, string memory name, uint256 gas) internal {
        vm.writeLine(outPath, string(abi.encodePacked('    { "name": "', name, '", "gas": ', toString(gas), " }\n")));
    }

    function writeJSONStepWithStats(string memory outPath, string memory name, uint256 count, uint256[] memory gases)
        internal
    {
        (uint256 minVal, uint256 maxVal, uint256 sum,,) = computeStats(gases);
        uint256 avg = count > 0 ? sum / count : 0;

        vm.writeLine(
            outPath,
            string(
                abi.encodePacked(
                    '    { "name": "',
                    name,
                    '", "count": ',
                    toString(count),
                    ', "total_gas": ',
                    toString(sum),
                    ', "avg_gas": ',
                    toString(avg),
                    ', "min_gas": ',
                    toString(minVal),
                    ', "max_gas": ',
                    toString(maxVal),
                    " },\n"
                )
            )
        );
    }

    function writeVoteStats(string memory outPath, uint256 count, uint256[] memory voteGases) internal {
        (uint256 minVote, uint256 maxVote, uint256 sumVotes, uint256 medianVote, uint256 p90Vote) =
            computeStats(voteGases);
        uint256 avgVote = count > 0 ? (sumVotes / count) : 0;

        vm.writeLine(
            outPath,
            string(
                abi.encodePacked(
                    '    { "name": "cast_votes", "count": ',
                    toString(count),
                    ', "total_gas": ',
                    toString(sumVotes),
                    ', "avg_gas_per_vote": ',
                    toString(avgVote),
                    ', "min_gas": ',
                    toString(minVote),
                    ', "max_gas": ',
                    toString(maxVote),
                    ', "median_gas": ',
                    toString(medianVote),
                    ', "p90_gas": ',
                    toString(p90Vote),
                    " },\n"
                )
            )
        );

        vm.writeLine(outPath, '    { "name": "cast_votes_per_call", "gases": [');
        for (uint256 i = 0; i < count; ++i) {
            string memory comma = i + 1 < count ? "," : "";
            vm.writeLine(outPath, string(abi.encodePacked("      ", toString(voteGases[i]), comma)));
        }
        vm.writeLine(outPath, "    ] },\n");
    }

    function writeJSONFooter(
        string memory outPath,
        uint256 txCount,
        uint256 totalGas,
        uint256 gasCostPerGwei,
        uint256 ethUsdRate
    ) internal {
        uint256 costInWei = (totalGas * gasCostPerGwei * 1_000_000_000) / PRECISION;
        uint256 totalValueUSD_scaled = (costInWei * ethUsdRate) / 1e18;
        string memory totalValueUSD_str = scaledUintToDecimalString(totalValueUSD_scaled, PRECISION);

        string memory footer = string(
            abi.encodePacked(
                "  ],\n",
                '  "totals": { "tx_count": ',
                toString(txCount),
                ', "total_gas": ',
                toString(totalGas),
                ', "total_value_usd": "',
                totalValueUSD_str,
                '"',
                ', "total_value_usd_scaled": ',
                toString(totalValueUSD_scaled),
                " }\n",
                "}\n"
            )
        );

        vm.writeLine(outPath, footer);
    }
}

/// @dev Universal actor that can perform any role (Owner, Plain Voter, ZK Voter, Semaphore Voter)
///      Used to simulate distinct msg.sender for benchmarking.
contract BenchmarkActor {
    VotingSystemEngine public immutable vse;

    constructor(address vse_) {
        vse = VotingSystemEngine(vse_);
    }

    // --- Owner Actions ---

    function createPlainPoll(
        string calldata title,
        string calldata description,
        string[] calldata options,
        address eligibilityModule,
        address voteStorage
    ) external returns (uint256) {
        return vse.createPoll(title, description, options, "", "", eligibilityModule, voteStorage);
    }

    function createPoll(
        string calldata title,
        string calldata description,
        string[] calldata options,
        bytes calldata voteStorageConfig,
        bytes calldata eligibilityConfig,
        address eligibilityModule,
        address voteStorage
    ) external returns (uint256) {
        return vse.createPoll(
            title, description, options, voteStorageConfig, eligibilityConfig, eligibilityModule, voteStorage
        );
    }

    function startPoll(uint256 pollId) external {
        vse.startPoll(pollId);
    }

    function endPoll(uint256 pollId) external {
        vse.endPoll(pollId);
    }

    function whitelistUser(uint256 pollId, address user) external {
        vse.whitelistUser(pollId, user);
    }

    function whitelistUsers(uint256 pollId, address[] calldata users) external {
        vse.whitelistUsers(pollId, users);
    }

    function publishEncryptedResults(uint256 pollId, uint256[16] calldata tally, ZKVoteLib.Proof calldata proof)
        external
    {
        vse.publishEncryptedResults(pollId, tally, proof);
    }

    // --- Voter Actions ---

    // Plain
    function vote(uint256 pollId, uint256 optionIdx) external returns (uint256) {
        return vse.castVote(pollId, optionIdx);
    }

    // ZK (ElGamal only)
    function castEncryptedVote(uint256 pollId, uint256[64] calldata encVote, ZKVoteLib.Proof calldata proof) external {
        vse.castEncryptedVote(pollId, encVote, proof);
    }

    // Semaphore Registration
    function registerVoter(uint256 pollId, uint256 identityCommitment) external returns (uint256 gasUsed) {
        uint256 g0 = gasleft();
        vse.registerVoter(pollId, identityCommitment);
        uint256 g1 = gasleft();
        return g0 - g1;
    }

    // Semaphore Plain Vote
    function castVoteWithProof(uint256 pollId, uint256 optionIdx, uint256 nullifierHash, uint256[8] calldata proof)
        external
        returns (uint256 gasUsed)
    {
        uint256 g0 = gasleft();
        vse.castVoteWithProof(pollId, optionIdx, nullifierHash, proof);
        uint256 g1 = gasleft();
        return g0 - g1;
    }

    // Semaphore ZK Vote
    function castEncryptedVoteWithProof(
        uint256 pollId,
        uint256 nullifierHash,
        uint256[8] calldata semaphoreProof,
        uint256[64] calldata encVote,
        ZKVoteLib.Proof calldata elgamalProof
    ) external returns (uint256 gasUsed) {
        uint256 g0 = gasleft();
        vse.castEncryptedVoteWithProof(pollId, nullifierHash, semaphoreProof, encVote, elgamalProof);
        uint256 g1 = gasleft();
        return g0 - g1;
    }
}
