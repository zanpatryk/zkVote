// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {DeployVotingSystem} from "../DeployVotingSystem.s.sol";
import {HelperConfig} from "../HelperConfig.s.sol";
import {VotingSystemEngine} from "../../src/core/VotingSystemEngine.sol";

contract GasMeter {
    /// @notice Measures gas used by performing a call to `target` with `data`.
    /// @return gasUsed the amount of gas used for the call (g0 - g1)
    /// @return returnData returned bytes of the call
    function measureCall(address target, bytes calldata data)
        external
        returns (uint256 gasUsed, bytes memory returnData)
    {
        uint256 g0 = gasleft();
        (bool ok, bytes memory ret) = target.call(data);
        uint256 g1 = gasleft();
        require(ok, "call failed");
        return (g0 - g1, ret);
    }
}

contract OwnerActor {
    VotingSystemEngine public immutable vse;

    constructor(address vse_) {
        vse = VotingSystemEngine(vse_);
    }

    function createPoll(string calldata title, string calldata description, string[] calldata options)
        external
        returns (uint256)
    {
        return vse.createPoll(title, description, options);
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

    function removeWhitelisted(uint256 pollId, address user) external {
        vse.removeWhitelisted(pollId, user);
    }
}

contract VoterActor {
    VotingSystemEngine public immutable vse;

    constructor(address vse_) {
        vse = VotingSystemEngine(vse_);
    }

    // calls VSE.castVote; from VSE perspective msg.sender == address(this)
    function vote(uint256 pollId, uint256 optionIdx) external returns (uint256) {
        return vse.castVote(pollId, optionIdx);
    }
}

contract Benchmark is Script {
    DeployVotingSystem deployer;
    HelperConfig helper;

    function toString(uint256 value) internal pure returns (string memory) {
        // OpenZeppelin-like uint -> string
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // simple in-memory stats helpers (run AFTER vm.stopBroadcast to avoid adding gas to totals)
    function computeStats(uint256[] memory arr)
        internal
        pure
        returns (uint256 minVal, uint256 maxVal, uint256 sum, uint256 median, uint256 p90)
    {
        uint256 n = arr.length;
        if (n == 0) {
            return (0, 0, 0, 0, 0);
        }
        // compute min/max/sum
        minVal = arr[0];
        maxVal = arr[0];
        sum = 0;
        for (uint256 i = 0; i < n; ++i) {
            uint256 v = arr[i];
            sum += v;
            if (v < minVal) minVal = v;
            if (v > maxVal) maxVal = v;
        }

        // make a copy and sort (simple insertion sort ok for moderate sizes like <= 5000)
        uint256[] memory copy = new uint256[](n);
        for (uint256 i = 0; i < n; ++i) {
            copy[i] = arr[i];
        }

        for (uint256 i = 1; i < n; ++i) {
            uint256 key = copy[i];
            uint256 j = i;
            while (j > 0 && copy[j - 1] > key) {
                copy[j] = copy[j - 1];
                j--;
            }
            copy[j] = key;
        }

        // median
        if (n % 2 == 1) {
            median = copy[n / 2];
        } else {
            // average of middle two
            median = (copy[n / 2 - 1] + copy[n / 2]) / 2;
        }

        // P90 index: ceil(0.9 * n) - 1
        uint256 idx = (9 * n + 9) / 10; // ceil(0.9*n)
        if (idx == 0) idx = 1;
        if (idx > n) idx = n;
        p90 = copy[idx - 1];
    }

    // parse a decimal string like "3102.24" into an integer scaled by `precision` (e.g. precision=1e6)
    function parseDecimalStringToUint(string memory s, uint256 precision) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 i = 0;
        // skip possible leading spaces
        while (i < b.length && (b[i] == 0x20 || b[i] == 0x09 || b[i] == 0x0A || b[i] == 0x0D)) i++;

        // parse integer part
        uint256 intPart = 0;
        while (i < b.length && b[i] >= 0x30 && b[i] <= 0x39) {
            intPart = intPart * 10 + (uint8(b[i]) - 48);
            i++;
        }

        uint256 scaled = intPart * precision;

        // if there's a dot, parse fractional part up to precision digits
        if (i < b.length && b[i] == 0x2E) {
            // '.'
            i++;
            uint256 factor = precision / 10;
            while (i < b.length && b[i] >= 0x30 && b[i] <= 0x39 && factor > 0) {
                scaled += (uint8(b[i]) - 48) * factor;
                factor = factor / 10;
                i++;
            }
            // if fractional digits fewer than precision, remaining digits already accounted for by factor
        }

        return scaled;
    }

    // convert scaled integer (value * precision) back to a decimal string "12.345678" with precision digits
    function scaledUintToDecimalString(uint256 scaled, uint256 precision) internal pure returns (string memory) {
        // precision must be power of 10 (e.g., 1_000_000)
        uint256 intPart = scaled / precision;
        uint256 frac = scaled % precision;

        string memory intStr = toString(intPart);

        // build fractional string with leading zeros
        uint256 prec = precision;
        // determine number of digits in precision (e.g., 6 for 1_000_000)
        uint256 digits = 0;
        while (prec > 1) {
            prec /= 10;
            digits++;
        }

        if (digits == 0) {
            return intStr;
        }

        bytes memory fracBuf = new bytes(digits);
        // fill from right to left
        for (uint256 i = 0; i < digits; ++i) {
            uint256 d = frac % 10;
            fracBuf[digits - 1 - i] = bytes1(uint8(48 + d));
            frac /= 10;
        }

        return string(abi.encodePacked(intStr, ".", string(fracBuf)));
    }

    function run() external returns (bool) {
        string memory configRaw = vm.readFile("script/benchmark/BenchmarkConfig.json");

        uint256 participants = vm.parseJsonUint(configRaw, ".participants");
        bool batchUpload = abi.decode(vm.parseJson(configRaw, ".batchUpload"), (bool));

        string memory runNumber = toString(block.timestamp);

        // fixed-point precision (6 decimal places)
        uint256 PRECISION = 1_000_000;

        // parse gasCostPerGwei e.g. "0.33"
        string memory gasCostStr = abi.decode(vm.parseJson(configRaw, ".gasCostPerGwei"), (string));
        uint256 gasCostPerGwei_scaled = parseDecimalStringToUint(gasCostStr, PRECISION); // gas cost in gwei * 1e6

        // parse ethUsdRate e.g. "3102.24"
        string memory ethUsdStr = abi.decode(vm.parseJson(configRaw, ".ethUsdRate"), (string));
        uint256 ethUsd_scaled = parseDecimalStringToUint(ethUsdStr, PRECISION); // ETH price in USD * 1e6

        // 1) Deploy the voting system (using DeployVotingSystem)
        deployer = new DeployVotingSystem();

        (VotingSystemEngine vse,,,, HelperConfig helperConf) = deployer.run();
        helper = helperConf;

        // get deployerKey for further broadcasts (HelperConfig.activeNetworkConfig is assumed to return a uint)
        uint256 deployerKey = helper.activeNetworkConfig();

        // begin broadcast for our instrumentation / actor deployments & interactions
        vm.startBroadcast(deployerKey);

        // Deploy GasMeter and OwnerActor (owner will be OwnerActor contract)
        GasMeter gasMeter = new GasMeter();
        OwnerActor ownerActor = new OwnerActor(address(vse));

        // Deploy voter actor contracts
        address[] memory actors = new address[](participants);
        for (uint256 i = 0; i < participants; ++i) {
            VoterActor va = new VoterActor(address(vse));
            actors[i] = address(va);
        }

        // Prepare poll options
        string[] memory options = new string[](2);
        options[0] = "Yes";
        options[1] = "No";

        // Prepare report data holders
        uint256 totalGas = 0;
        uint256 gas_create;
        uint256 gas_start;
        uint256 gas_whitelist_total;
        uint256 gas_end;
        uint256[] memory voteGases = new uint256[](participants);

        // 2) Create poll (measured by GasMeter calling ownerActor.createPoll)
        bytes memory createData =
            abi.encodeWithSelector(OwnerActor.createPoll.selector, "Benchmark Poll", "Benchmark description", options);
        (uint256 gCreate, bytes memory retCreate) = gasMeter.measureCall(address(ownerActor), createData);
        totalGas += gCreate;
        gas_create = gCreate;

        // decode pollId from return
        uint256 pollId = abi.decode(retCreate, (uint256));

        // 3) Start poll
        bytes memory startData = abi.encodeWithSelector(OwnerActor.startPoll.selector, pollId);
        (uint256 gStart,) = gasMeter.measureCall(address(ownerActor), startData);
        totalGas += gStart;
        gas_start = gStart;

        // 4) Whitelist participants (batch or per-user)
        gas_whitelist_total = 0;
        if (batchUpload) {
            // batch upload
            bytes memory batchData = abi.encodeWithSelector(OwnerActor.whitelistUsers.selector, pollId, actors);
            (uint256 gBatch,) = gasMeter.measureCall(address(ownerActor), batchData);
            gas_whitelist_total = gBatch;
            totalGas += gBatch;
        } else {
            // individual
            for (uint256 i = 0; i < participants; ++i) {
                bytes memory singleData = abi.encodeWithSelector(OwnerActor.whitelistUser.selector, pollId, actors[i]);
                (uint256 gSingle,) = gasMeter.measureCall(address(ownerActor), singleData);
                gas_whitelist_total += gSingle;
                totalGas += gSingle;
            }
        }

        // 5) Cast votes (measure each voter actor)
        uint256 sumVoteGas = 0;
        for (uint256 i = 0; i < participants; ++i) {
            uint256 optionIdx = i % 2; // simple round-robin
            bytes memory voteData = abi.encodeWithSelector(VoterActor.vote.selector, pollId, optionIdx);
            (uint256 gVote,) = gasMeter.measureCall(actors[i], voteData);
            voteGases[i] = gVote;
            sumVoteGas += gVote;
        }
        totalGas += sumVoteGas;

        // 6) End poll
        bytes memory endData = abi.encodeWithSelector(OwnerActor.endPoll.selector, pollId);
        (uint256 gEnd,) = gasMeter.measureCall(address(ownerActor), endData);
        gas_end = gEnd;
        totalGas += gEnd;

        // stop broadcasting — everything after this point won't affect chain gas totals
        vm.stopBroadcast();

        // 7) Prepare stats for votes (off-broadcast; cheap local computation)
        (uint256 minVote, uint256 maxVote, uint256 sumVotes, uint256 medianVote, uint256 p90Vote) =
            computeStats(voteGases);
        uint256 avgVote = participants > 0 ? (sumVotes / participants) : 0;

        // 8)
        // --- compute cost in wei precisely ---
        // gasCostPerGwei_scaled is gas price in gwei scaled by PRECISION
        // Convert: gasPrice (gwei) = gasCostPerGwei_scaled / PRECISION
        // gwei -> wei = * 1e9
        // costInWei = totalGas * gasPrice_gwei * 1e9
        // costInWei = totalGas * gasCostPerGwei_scaled * 1e9 / PRECISION

        uint256 costInWei = (totalGas * gasCostPerGwei_scaled * 1_000_000_000) / PRECISION;

        // totalValueUSD_scaled = costInWei * ethUsd_scaled / 1e18
        // where ethUsd_scaled = ETH price * PRECISION (so result is USD * PRECISION)
        uint256 totalValueUSD_scaled = (costInWei * ethUsd_scaled) / 1e18;

        // changes to "14.064891"
        string memory totalValueUSD_str = scaledUintToDecimalString(totalValueUSD_scaled, PRECISION);

        // 9) Prepare JSON report and write to file: script/benchmark/results/run{n}.json
        string memory outPath = string(abi.encodePacked("script/benchmark/results/run", runNumber, ".json"));

        // build JSON (kept readable)
        string memory jsonHeader = string(
            abi.encodePacked(
                "{\n",
                '  "run": ',
                runNumber,
                ",\n",
                '  "timestamp": ',
                toString(block.timestamp),
                ",\n",
                '  "config": {\n',
                '    "participants": ',
                toString(participants),
                ",\n",
                '    "batchUpload": ',
                (batchUpload ? "true" : "false"),
                "\n",
                "  },\n",
                '  "steps": [',
                "\n"
            )
        );

        vm.writeFile(outPath, jsonHeader);

        // create
        vm.writeLine(
            outPath, string(abi.encodePacked('    { "name": "create_poll", "gas": ', toString(gas_create), " },\n"))
        );
        // start
        vm.writeLine(
            outPath, string(abi.encodePacked('    { "name": "start_poll", "gas": ', toString(gas_start), " },\n"))
        );
        // whitelist
        vm.writeLine(
            outPath,
            string(
                abi.encodePacked(
                    '    { "name": "whitelist", "batchUpload": ',
                    (batchUpload ? "true" : "false"),
                    ', "gas_total": ',
                    toString(gas_whitelist_total),
                    " },\n"
                )
            )
        );

        // votes summary
        vm.writeLine(
            outPath,
            string(
                abi.encodePacked(
                    '    { "name": "cast_votes", "count": ',
                    toString(participants),
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

        // per-call gases (compact)
        vm.writeLine(outPath, '    { "name": "cast_votes_per_call", "gases": [');
        for (uint256 i = 0; i < participants; ++i) {
            string memory comma = i + 1 < participants ? "," : "";
            vm.writeLine(outPath, string(abi.encodePacked("      ", toString(voteGases[i]), comma)));
        }
        vm.writeLine(outPath, "    ] },"); // end per-call

        // end poll
        vm.writeLine(outPath, string(abi.encodePacked('    { "name": "end_poll", "gas": ', toString(gas_end), " }\n")));

        // totals and tx_count = create(1) + start(1) + whitelist(W) + votes(P) + end(1) = 3 + W + P
        uint256 whitelistTxs = batchUpload ? 1 : participants;
        uint256 txCount = 3 + whitelistTxs + participants;

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

        return true;
    }
}
