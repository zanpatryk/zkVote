# zkVote Contracts

Modern, modular voting smart contracts written in Solidity (Foundry). The system provides a flexible framework for creating polls with pluggable eligibility and storage modules.

This package serves as the core on-chain infrastructure for zkVote, supporting both standard transparent voting and privacy-enhanced anonymous voting using Zero-Knowledge Proofs.

## Features

- **Modular Architecture**: Pluggable modules for eligibility and vote storage.
- **Privacy-Preserving**: Integrated with [Semaphore Protocol](https://semaphore.appliedzkp.org/) for anonymous membership.
- **ZK Vote Vectors**: Support for homomorphic-compatible ZK vote vectors using ElGamal.
- **Account Abstraction (ERC-4337)**: Gasless voting via `PollSponsorPaymaster` allowing poll creators to sponsor transaction fees.
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

### Account Abstraction Modules

- **PollSponsorPaymaster** (`src/account_abstraction/PollSponsorPaymaster.sol`): ERC-4337 Paymaster that allows poll creators to sponsor gas fees for voters.
- **zkVoteSimpleAccount** (`src/account_abstraction/zkVoteSimpleAccount.sol`): Simple smart account for gasless voting operations.

### External Dependencies

- **SemaphoreVerifier**: Pre-deployed Semaphore protocol verifier contract used for anonymous membership proofs.

## Repository Structure

```text
contracts/
├── lib/             # External dependencies (OZ, Semaphore)
├── script/          # Deployment and benchmarking scripts
│   ├── benchmark/   # Gas cost measurement tools
│   └── DeployVotingSystem.s.sol
├── src/
│   ├── account_abstraction/ # ERC-4337 gasless voting
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

# Install Account Abstraction (ERC-4337) dependency
forge install eth-infinitism/account-abstraction

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

## Deployed Contracts

The system is deployed on both **Sepolia** and **Base Sepolia**.

### Sepolia (Chain ID 11155111)

| Contract              | Address                                      |
| --------------------- | -------------------------------------------- |
| VotingSystemEngine    | `0xC566Be757A027446461C5C3aDefcB9594961bc13` |
| PollManager           | `0x7Db51fC5F3E55Af8AEec3A96699064B9186b5D08` |
| SemaphoreEligibility  | `0xb94B02ACbF4f6E511151b37506C8BbD19Dd8EbEf` |
| SemaphoreVerifier     | `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8` |
| EligibilityV0         | `0xE51BDfE6E09b4e37fd87e95cFB2Dd7C94f88AE24` |
| VoteStorageV0         | `0x22Bf9F62F0ec4a860adC292ace08E1825496A6aD` |
| ZkElGamalVoteVector   | `0x2089B3993cca3353005aC1258c52ac0C79853592` |
| ElgamalVoteVerifier   | `0xa3145aF3f4e20f171C4403f32f98687564Ac898d` |
| ElgamalTallyVerifier  | `0x1F2B17622d03BD38d2F4bb697c4b579Ac7E23114` |
| EntryPoint (ERC-4337) | `0xC4018B2907a623E0490FEf5FeA3207aF954f34fF` |
| PollSponsorPaymaster  | `0x5BBC00f3F1FD7f1ab42Fed7b35f2DF2d25f7C76b` |
| zkVoteSimpleAccount   | `0xCB06f2578A0EC8707a939dcc51cE381C84F444F2` |

### Base Sepolia (Chain ID 84532)

| Contract              | Address                                      |
| --------------------- | -------------------------------------------- |
| VotingSystemEngine    | `0x5Ae7F0999f63b8B0803699B3e31545F6562910E6` |
| PollManager           | `0x9B90cB154fEaa5B51978148Fd6E6BfCABE83e671` |
| SemaphoreEligibility  | `0xB3ac11759Bd47d3bd288791b1723f73d953E9819` |
| SemaphoreVerifier     | `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8` |
| EligibilityV0         | `0xfd0081c27c020C9daAb6Fa574E3B57c33c44B00F` |
| VoteStorageV0         | `0x4B62fDD46Cd5B26509F7b3143733CBfd7F6cE425` |
| ZkElGamalVoteVector   | `0x3F0a65C0b0d2118A909F7e148f677Afab14351c5` |
| ElgamalVoteVerifier   | `0x3BCC9f97a0873DfaCCcEA0AA2BBa14E7a06A6826` |
| ElgamalTallyVerifier  | `0x5Cd278Cc71A52383c603BE447277F3944974fddb` |
| EntryPoint (ERC-4337) | `0x7ADBE3a5f57244428e2C2cbaE58cAEa3197d1A03` |
| PollSponsorPaymaster  | `0x16009E0EBd4AE0C5bBE0812C276944D33f5bc449` |
| zkVoteSimpleAccount   | `0xE45B9CFb2C1B63244D91897718A1a6d5982eae32` |
