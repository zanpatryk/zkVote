# zkVote Contracts

Modern, modular voting smart contracts written in Solidity (Foundry). The system lets anyone create a poll, manage eligibility, collect votes, and mint a result NFT that encodes poll results on-chain as base64 JSON.

This package is the on-chain component of the zkVote thesis project. It focuses on clean modularity and testability. While current modules implement simple whitelisting and plain vote storage, the architecture is designed to plug in more advanced eligibility (e.g., ZK-based membership proofs) and storage schemes in future versions.

## Features

- **Modular engine** orchestrating poll lifecycle and delegation to modules
- **Poll management** for creation, state transitions, metadata and options
- **Eligibility module (V0)** simple per-poll whitelist (owner-managed)
- **Vote storage (V0)** prevents double voting and tallies per option
- **Result NFT** ERC721 with metadata that reflects final counts
- **Foundry scripts** to deploy locally (Anvil) and to Sepolia
- **Comprehensive tests** unit and integration

## Architecture

- **VotingSystemEngine** (`src/core/VotingSystemEngine.sol`)
  - Entry point. Owns the system flow.
  - Creates polls via `PollManager` and enforces state transitions.
  - Uses `EligibilityModule` to gate voters and `VoteStorage` to record votes.
  - Builds a base64 JSON metadata and mints a `ResultNFT` after a poll ends.

- **PollManager** (`src/poll_management/PollManager.sol`)
  - Persists poll metadata: title, description, options, owner, state.
  - States: `CREATED (0)`, `ACTIVE (1)`, `ENDED (2)`.

- **EligibilityModuleV0** (`src/eligibility/EligibilityModuleV0.sol`)
  - Per-poll whitelists. Only the engine (as owner) can modify.

- **VoteStorageV0** (`src/vote_storage/VoteStorageV0.sol`)
  - Prevents double voting per poll, tallies option counts, stores vote records.

- **ResultNFT** (`src/result_nft/ResultNFT.sol`)
  - ERC721 + URI storage + AccessControl.
  - Engine gets `MINTER_ROLE` to mint result NFTs.

- **Interfaces** (`src/interfaces/`)
  - `IPollManager`, `IEligibilityModule`, `IVoteStorage` define pluggable boundaries.

## Repository Structure

```
contracts/
  src/
    core/VotingSystemEngine.sol
    poll_management/PollManager.sol
    eligibility/EligibilityModuleV0.sol
    vote_storage/VoteStorageV0.sol
    result_nft/ResultNFT.sol
    interfaces/{IPollManager,IEligibilityModule,IVoteStorage}.sol
  script/
    DeployVotingSystem.s.sol
    HelperConfig.s.sol
    benchmark/
      Benchmark.s.sol
      BenchmarkConfig.json
      results/
  test/
    unit/
      ElgibilityModuleTest.t.sol
      PollManagerTest.t.sol
      VoteStorageTest.t.sol
    integration/
      IntegrationTest.t.sol
  Makefile
```

## Prerequisites

- Foundry (forge, cast, anvil)
  - Install: https://book.getfoundry.sh/getting-started/installation
- A modern Node/PNPM setup is optional if integrating with a frontend.

## Quick Start

```
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test -vvv
```

## Make Targets

- **make build**: `forge build`
- **make test**: `forge test`
- **make clean**: `forge clean`
- **make start-anvil**: start Anvil in background (pid saved to `anvil.pid`)
- **make stop-anvil**: stop background Anvil
- **make deploy-anvil**: deploy the full system to local Anvil
- **make deploy-sepolia**: deploy to Sepolia (requires env vars)
- **make benchmark-anvil**: run benchmark script against local Anvil

## Local Deployment (Anvil)

1. Start local chain
   ```
   make start-anvil
   ```
2. Deploy
   ```
   make deploy-anvil
   ```
   This runs `script/DeployVotingSystem.s.sol` and returns:
   - VotingSystemEngine
   - PollManager
   - EligibilityModuleV0
   - VoteStorageV0
   - ResultNFT (with `MINTER_ROLE` granted to the engine)

To view logs, check `anvil.log`. Stop with `make stop-anvil`.

## Test Suite

Run all tests:

```
make test
```

Highlights:

- Unit tests for each module in `test/unit/`
- Full end-to-end flow in `test/integration/IntegrationTest.t.sol`

## Sepolia Deployment

Set required environment variables before deploying:

```
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/<PROJECT_ID>"  # or other provider
export PRIVATE_KEY=0x<your_private_key>
```

Deploy:

```
make deploy-sepolia
```

`HelperConfig.s.sol` reads `PRIVATE_KEY` on Sepolia, or uses a default Anvil key locally.

## Usage Walkthrough (Core Calls)

Typical flow (addresses managed via your tooling or scripts):

1. **Create poll**
   - `VotingSystemEngine.createPoll(title, description, options)`
   - Owner of the poll is `msg.sender` that called `createPoll`.
2. **Start poll**
   - `VotingSystemEngine.startPoll(pollId)` → state moves to `ACTIVE`.
3. **Whitelist voters** (any time while ACTIVE)
   - `VotingSystemEngine.whitelistUser(pollId, user)` or `whitelistUsers(pollId, users)`
4. **Cast vote**
   - `VotingSystemEngine.castVote(pollId, optionIdx)`
   - Reverts if not whitelisted, invalid option, or double vote.
5. **End poll**
   - `VotingSystemEngine.endPoll(pollId)` → state moves to `ENDED`.
6. **Mint result NFT**
   - `VotingSystemEngine.mintResultNFT(pollId)`
   - Allowed for poll owner or any whitelisted voter once ENDED.
   - NFT metadata encodes final tallies per option.

Refer to `IntegrationTest.t.sol` for a concrete example of the entire lifecycle.

## Benchmarking

Local benchmark against Anvil:

```
make benchmark-anvil
```

Configuration lives in `script/benchmark/BenchmarkConfig.json`. Results may be written under `script/benchmark/results/` (adjust scripts as needed).

## Errors (selected)

- Engine: `VotingSystem__NotOwner`, `VotingSystem__InvalidPollState`, `VotingSystem__NotAuthorizedToMint`, etc.
- PollManager: `PollManager__EmptyOption`, `PollManager__InvalidState`
- VoteStorageV0: `VoteStorageV0__AlreadyVoted`
- EligibilityModuleV0: `EligibilityModuleV0__AlreadyWhitelisted`, `EligibilityModuleV0__NotWhitelisted`

## Notes and Assumptions

- Current modules are simple, gas-efficient baselines intended for extension.
- No reentrancy targets exist in core flows, but follow best practices when extending.
- Ensure to grant `MINTER_ROLE` on `ResultNFT` to the engine when deploying custom setups.
