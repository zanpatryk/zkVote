# @zkvote/lib

Core cryptographic utilities and shared logic for the zkVote ecosystem. This library provides implementations for ElGamal encryption, Pedersen commitments, and ZK proof generation/verification on the client-side.

## Features

- **ElGamal Encryption**: Secure, homomorphic encryption logic for voting tallies.
- **Pedersen Commitments**: Implementation of Pedersen commitments for private vote vectors.
- **Proof Utilities**: Helper functions for generating and preparing snarkjs proofs for on-chain verification.
- **Shared Contracts**: Common interface definitions and shared contract artifacts.

## Installation

This package is intended to be used within the zkVote monorepo. It is automatically linked to the `frontend` workspace.

```bash
bun install
```

## Usage

### Imported in Frontend

```javascript
import { generateProof } from "@zkvote/lib/proof";
import { encrypt } from "@zkvote/lib/elgamal";
```

## Available Scripts

- `bun run test`: Runs the unit tests and integration tests.
- `bun run test:coverage`: Runs tests and generates a coverage report.
- `bun run sync:artifacts`: Symlinks ZK artifacts from the `circuits` package to the local `artifacts/` directory for easier access.
- `bun run benchmark`: Runs performance benchmarks for cryptographic operations (automatically syncs artifacts first).

## Project Structure

- `src/`: JavaScript implementations of core cryptographic primitives.
  - `elgamal.js`: ElGamal encryption logic.
  - `pedersen.js`: Pedersen commitment logic.
  - `proof.js`: Snarkjs proof generation wrappers.
- `contracts/`: Shared contract artifacts and interfaces.
- `test/`: Unit and integration tests.
- `benchmark/`: Performance benchmarking scripts.
