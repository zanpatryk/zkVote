# @zkvote/lib

Core cryptographic utilities and shared logic for the zkVote system. This library provides implementations for ElGamal encryption, Pedersen commitments, and ZK proof generation/verification on the client-side.

## Features

- **ElGamal Encryption**: Secure, homomorphic encryption logic for voting tallies.
- **Pedersen Commitments**: Implementation of Pedersen commitments for private vote vectors.
- **Proof Utilities**: Helper functions for generating and preparing snarkjs proofs for on-chain verification.
- **Shared Contracts**: Common interface definitions and shared contract artifacts.
  - `ZKVoteLib`: Solidity library for on-chain BabyJubJub curve operations (point addition) and proof structures.
  - `IZKVerifier`: Standard interface for all ZK verifier contracts.
- **Verifier Contracts**: Pre-compiled Solidity verifiers for various circuit configurations:
  - `ElGamalTallyDecryptVerifier` (N8, N16)
  - `ElGamalVoteScalarVerifier` (N8, N16, N32, N64)
  - `ElGamalVoteVectorVerifier` (N8, N16)
  - `PedersenVoteVectorVerifier` (N8, N16)

## Installation

This package is intended to be used within the zkVote monorepo. It is automatically linked to the `frontend` workspace.

```bash
bun install
```

## Usage

### Imported in Frontend

```javascript
// Import specific modules
import { generateProof } from "@zkvote/lib/proof";
import { encrypt } from "@zkvote/lib/elgamal";

// Or import from the main entry point
import { proof, elgamal } from "@zkvote/lib";
```

> **Note:** usage of `generateProof` or other ZK utilities requires corresponding `.wasm` and `.zkey` artifacts to be available in the public path.

### Solidity Contracts

The library also exports shared contract interfaces and verifiers.

```solidity
import { ZKVoteLib } from "@zkvote/lib/contracts/ZKVoteLib.sol";
import { ElGamalVoteScalarVerifier_N16 } from "@zkvote/lib/contracts/ElGamalVoteScalarVerifier_N16.sol";

contract MyContract {
    using ZKVoteLib for uint256;
    // ...
}
```

## Available Scripts

- `bun run test`: Runs the unit tests and integration tests.
- `bun run test:coverage`: Runs tests and generates a coverage report.
- `bun run sync:artifacts`: Symlinks ZK artifacts (`.wasm` and `.zkey`) from the `circuits` package to the local `artifacts/` directory, required for client-side proof generation.
- `bun run benchmark`: Runs performance benchmarks for cryptographic operations (automatically syncs artifacts first).

## Project Structure

- `src/`: JavaScript implementations of core cryptographic primitives.
  - `elgamal.js`: ElGamal encryption logic.
  - `pedersen.js`: Pedersen commitment logic.
  - `proof.js`: Snarkjs proof generation wrappers.
- `contracts/`: Shared contract artifacts and interfaces.
- `test/`: Unit and integration tests.
- `benchmark/`: Performance benchmarking scripts.
