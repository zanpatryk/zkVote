// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    struct NetworkConfig {
        uint256 deployerKey;
        address semaphoreVerifier;
    }

    uint256 public constant DEFAULT_ANVIL_PRIVATE_KEY =
        0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    NetworkConfig public activeNetworkConfig;

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaConfig();
        } else if (block.chainid == 84532) {
            activeNetworkConfig = getBaseSepoliaConfig();
        } else {
            activeNetworkConfig = getOrCreateAnvilConfig();
        }
    }

    function getSepoliaConfig() public view returns (NetworkConfig memory) {
        // read PRIVATE_KEY from env when deploying to sepolia / public nets
        return
            NetworkConfig({
                deployerKey: vm.envUint("PRIVATE_KEY"),
                semaphoreVerifier: 0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8
            });
    }

    function getBaseSepoliaConfig() public view returns (NetworkConfig memory) {
        // read PRIVATE_KEY from env when deploying to Base Sepolia
        return
            NetworkConfig({
                deployerKey: vm.envUint("PRIVATE_KEY"),
                semaphoreVerifier: 0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8
            });
    }

    function getOrCreateAnvilConfig() public returns (NetworkConfig memory) {
        // if already set, return it
        if (activeNetworkConfig.deployerKey != 0) {
            return activeNetworkConfig;
        }

        // Default local / anvil key
        activeNetworkConfig = NetworkConfig({
            deployerKey: DEFAULT_ANVIL_PRIVATE_KEY,
            semaphoreVerifier: address(0)
        });
        return activeNetworkConfig;
    }
}
