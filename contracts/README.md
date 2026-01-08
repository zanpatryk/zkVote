# zkVote Contracts

Modern, modular voting smart contracts written in Solidity (Foundry). The system provides a flexible framework for creating polls with pluggable eligibility and storage modules.

This package serves as the core on-chain infrastructure for zkVote, supporting both standard transparent voting and privacy-enhanced anonymous voting using Zero-Knowledge Proofs.

## Features

- **Modular Architecture**: Pluggable modules for eligibility and vote storage.
- **Privacy-Preserving**: Integrated with [Semaphore Protocol](https://semaphore.appliedzkp.org/) for anonymous membership.
- **ZK Vote Vectors**: Support for homomorphic-compatible ZK vote vectors using ElGamal.
- **Result NFT**: Automatically mints a unique NFT with embedded results upon poll completion.
- **Extensive Benchmarking**: Scripts to measure gas performance across different voting schemes.
- **Developer Friendly**: Built with Foundry, featuring comprehensive tests and deployment scripts.

## Core Modules

- **VotingSystemEngine** (`src/core/VotingSystemEngine.sol`): The central orchestrator for poll lifecycles, whitelisting, and NFT minting.
- **PollManager** (`src/poll_management/PollManager.sol`): Manages poll metadata and state transitions.

### Eligibility Modules

- **EligibilityModuleV0**: Simple owner-managed whitelist.
- **SemaphoreEligibilityModule**: Privacy-first membership using Semaphore identity commitments.

### Vote Storage Modules

- **VoteStorageV0**: Standard transparent vote storage and tallying.
- **ZKElGamalVoteVector**: ZK-compatible storage that enables private vote casting with on-chain verification.

## Repository Structure

```text
contracts/
├── lib/             # External dependencies (OZ, Semaphore)
├── script/          # Deployment and benchmarking scripts
│   ├── benchmark/   # Gas cost measurement tools
│   └── DeployVotingSystem.s.sol
├── src/
│   ├── core/        # Central coordination
│   ├── eligibility/ # Voter identity and whitelisting
│   ├── interfaces/  # Cross-module definitions
│   ├── poll_management/ # Metadata storage
│   ├── result_nft/  # Post-poll rewards
│   └── vote_storage/ # Tallying and verification
└── test/
    ├── unit/        # Isolated module tests
    └── integration/ # End-to-end voting flows
```

## Quick Start

### Prerequisites

Install [Foundry](https://book.getfoundry.sh/getting-started/installation).

### Setup

```bash
# Install dependencies
forge install

# Build contracts
make build

# Run tests
make test
```

## Local Development (Anvil)

1. **Start Anvil**: `make start-anvil`
2. **Deploy System**: `make deploy-anvil`

The deployment script (`DeployVotingSystem.s.sol`) initializes the engine and default modules, preparing the system for local use.

## Benchmarking

We provide detailed benchmarking to compare traditional voting with ZK-enhanced schemes:

```bash
make benchmark-anvil
```

This runs complex scenarios (multiple polls, hundreds of voters) to verify gas scalability and performance. Configuration can be adjusted in `script/benchmark/BenchmarkConfig.json`.

## Testing

The test suite covers:

- **Unit Tests**: Found in `test/unit/`, ensuring individual modules behave correctly.
- **Integration Tests**: Found in `test/integration/`, simulating full lifecycles for both plain and ZK pools.

```bash
# Run specific ZK integration test
forge test --match-path test/integration/SemaphoreVoting.t.sol
```

## Deployment

To deploy to a testnet like Sepolia:

1. Configure `.env` with `SEPOLIA_RPC_URL` and `PRIVATE_KEY`.
2. Run `make deploy-sepolia`.
