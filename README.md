# zkVote

Privacy-preserving voting application using Zero-Knowledge Proofs and Semaphore.

zkVote allows users to participate in polls with complete privacy. By leveraging Semaphore, users can prove they belong to a group (are eligible to vote) without revealing their specific identity, ensuring that their vote remains anonymous yet verifiable.

## Features

- **Anonymous Voting**: Cast votes without revealing your identity using ZK Proofs.
- **Privacy-First Identity**: Managed via [Semaphore Protocol](https://semaphore.appliedzkp.org/).
- **Verifiable Results**: On-chain verification of proofs and vote tallies.
- **NFT Receipts**: Receive a unique NFT as proof of participation (optional).
- **Responsive UI**: Modern, clean, and intuitive frontend built with Next.js and Tailwind CSS.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Smart Contracts**: [Solidity](https://soliditylang.org/), [Foundry](https://book.getfoundry.sh/)
- **ZK Circuits**: [Circom](https://docs.circom.io/getting-started/installation/)
- **Identity/Privacy**: [Semaphore Protocol](https://semaphore.appliedzkp.org/)
- **Package Manager**: [Bun](https://bun.sh/)

## Project Structure

```text
zkVote/
├── circuits/      # Circom ZK circuits and logic
├── contracts/     # Solidity smart contracts (Foundry)
├── frontend/      # Next.js web application
├── packages/      # Shared libraries (e.g., zkvote-lib)
├── scripts/       # Utility scripts for local setup and ABIs
└── package.json   # Root workspace configuration
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (Runtime and package manager)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (Smart contract development)
- [Circom](https://docs.circom.io/getting-started/installation/) (ZK circuit compiler)
- [Rust](https://www.rust-lang.org/tools/install) (Required for Circom and ZK components)

### Initial Setup

1. **Clone the repository**:

   ```bash
   git clone --recursive https://github.com/WUT-MiNI-Bachelor-Thesis/zkVote.git
   cd zkVote
   ```

2. **One-command Setup**:
   This will install dependencies, update submodules, compile ZK circuits, download ZK artifacts, and build smart contracts:
   ```bash
   bun run setup
   ```

### Running Locally

To start the entire local environment (blockchain, contract deployment, and frontend) with a single command:

```bash
bun run dev:local
```

This script will:

1. Start a local **Anvil** blockchain instance.
2. Deploy the smart contracts to the local chain.
3. Generate the necessary ABIs and configuration for the frontend.
4. Start the frontend development server at `http://localhost:3000`.

## Testing

### Full Suite

```bash
bun run test:contracts  # Forge tests for smart contracts
bun run test:ui         # Frontend unit tests
bun run test:circuits   # ZK circuit unit tests
```

### Integration Tests

```bash
bun run test:ui:integration       # Playwright/Cypress UI integration tests
bun run test:circuits:integration # ZK integration tests
```

## Benchmarking

Run local benchmarks for gas costs and performance:

```bash
bun run benchmarking:local
```

## Deployment

To deploy to Sepolia testnet (requires configuration in `contracts/.env`):

```bash
bun run deploy:sepolia
```
