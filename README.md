# zkVote

The rise of distributed communities, such as Open Source contributor groups and Decentralized Autonomous Organizations (DAOs), has created an urgent need for voting systems that do not rely on physical presence or centralized trust. Traditional electronic voting often suffers from a "trust deficit," requiring voters to rely on the honesty of server administrators and the opacity of private databases.

**zkVote** is a decentralized, privacy-preserving voting prototype that replaces administrative trust with mathematical certainty. It utilizes the Ethereum blockchain as an immutable bulletin board and employs **Zero-Knowledge SNARKs (Groth16)** to ensure election integrity without compromising participant privacy.

By integrating the **Semaphore protocol** for anonymous membership and additively homomorphic **ElGamal encryption** for ballot secrecy, zkVote breaks the link between a voter’s identity and their choice. Furthermore, it addresses the "UX gap" of blockchain applications by implementing **Account Abstraction (ERC-4337)**, enabling a gasless experience where poll creators can sponsor transaction costs for participants.

## Live Demo

We have deployed the frontend to: **[https://zk-vote-six.vercel.app/](https://zk-vote-six.vercel.app/)**

This deployment uses:

- **Semaphore CDN** for fetching Semaphore proof artifacts (wasm, zkeys).
- **Custom CDN** for fetching our custom ZK proof artifacts (wasm, zkeys).

## Features

- **Anonymous Voting**: Cast votes without revealing your identity using ZK Proofs.
- **Privacy-First Identity**: Managed via [Semaphore Protocol](https://semaphore.appliedzkp.org/).
- **Verifiable Results**: On-chain verification of proofs and vote tallies.
- **NFT Receipts**: Receive a unique NFT as proof of participation (optional).
- **Responsive UI**: Modern, clean, and intuitive frontend built with Next.js and Tailwind CSS.
- **Gasless Transactions**: Account Abstraction (ERC-4337) support for sponsored voting.

## How It Works

### Zero-Knowledge Membership

**Technology: Semaphore / zk-SNARKs**

We use the Semaphore protocol to prove your eligibility without revealing your identity. You generate a local secret, and the blockchain verifies a Zero-Knowledge Proof that confirms "I am a member of this group" without ever saying "I am User X". This breaks the link between your wallet address and your vote.

### ElGamal Homomorphic Encryption

**Technology: Elliptic Curve Cryptography**

Your vote is never stored as plain text. Instead, it is encrypted using ElGamal encryption on your device. The magic of homomorphic encryption allows the smart contract to mathematically add these encrypted votes together—summing up the total—without ever decrypting the individual ballots.

### Cryptographic Nullifiers

**Technology: Poseidon Hash Function**

To prevent double-voting without tracking users, we generate a unique "nullifier" hash for each vote. If you try to vote again, the nullifier will be identical, and the smart contract will reject the proof. This guarantees the "one person, one vote" principle while preserving total anonymity.

### Proof of Tally

**Technology: Verifiable Decryption**

When the poll closes, the final encrypted sum is decrypted by the poll authority. However, to ensure they didn't fake the result, they must provide a Zero-Knowledge Proof (ZK-SNARK) that certifies: "The decrypted result X mathematically corresponds to the encrypted sum Y". This makes the tally mathematically verifiable by anyone.

### Native On-Chain Execution

**Technology: Smart Contracts / EVM**

Unlike other systems that use off-chain servers, zkVote runs entirely on the blockchain. Every registration, vote, and tally calculation is verifiable on-chain. There is no central server to trust, no hidden database, and no single point of failure.

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

## Running Locally

### Prerequisites

- [Bun](https://bun.sh/) (Runtime and package manager)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (Smart contract development)
- [Circom](https://docs.circom.io/getting-started/installation/) (ZK circuit compiler)
- [Rust](https://www.rust-lang.org/tools/install) (Required for Circom and ZK components)

### Setup

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

### Running the App

#### Development Mode

To start the entire local environment (blockchain, contract deployment, and frontend) with a single command:

```bash
bun run dev:local
```

#### Production Build (Local)

To simulate a production-like environment with built artifacts:

1. **Start Local Chain**:

   ```bash
   bun run dev:chain
   ```

2. **Deploy Contracts** (in a new terminal):

   ```bash
   cd contracts && make deploy
   cd ..
   bun run generate:abis
   ```

3. **Build Frontend**:

   ```bash
   bun run build --filter frontend
   ```

4. **Start Frontend**:
   ```bash
   bun run start --filter frontend
   ```

### Development Commands

Additional utility commands available in `package.json`:

| Command                   | Description                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev:frontend`    | Starts only the Next.js frontend development server.                                                                                                                                                                                                                                                                                                                                     |
| `bun run dev:chain`       | Starts the local Anvil blockchain with increased code size limit.                                                                                                                                                                                                                                                                                                                        |
| `bun run dev:local`       | Starts the full local development environment (Anvil + deploy + frontend).                                                                                                                                                                                                                                                                                                               |
| `bun run build`           | Builds both contracts and frontend.                                                                                                                                                                                                                                                                                                                                                      |
| `bun run build:contracts` | Compiles contracts using Foundry and generates ABIs.                                                                                                                                                                                                                                                                                                                                     |
| `bun run build:circuits`  | Compiles Circom circuits (requires `circuits` workspace setup).                                                                                                                                                                                                                                                                                                                          |
| `bun run generate:abis`   | Extracts ABIs from Foundry artifacts to `frontend/src/lib/abis`.                                                                                                                                                                                                                                                                                                                         |
| `bun run setup`           | Runs the complete project setup, including:<br>1. **Update Git Submodules** (for libraries)<br>2. **Install Dependencies** (`bun install`)<br>3. **Build ZK Circuits** (Circom compilation)<br>4. **Run ZK Trusted Setup** (Phase 2)<br>5. **Sync ZK Artifacts** (to shared lib and frontend)<br>6. **Install Forge Dependencies** (contracts)<br>7. **Build Smart Contracts** (Foundry) |
| `bun run start`           | Starts the production build of the frontend.                                                                                                                                                                                                                                                                                                                                             |

## Deployed Contracts

The system is deployed on both **Sepolia** and **Base Sepolia**.

### Sepolia (Chain ID 11155111)

| Contract               | Address                                      |
| ---------------------- | -------------------------------------------- |
| VotingSystemEntryPoint | `0xC566Be757A027446461C5C3aDefcB9594961bc13` |
| PollManager            | `0x7Db51fC5F3E55Af8AEec3A96699064B9186b5D08` |
| SemaphoreEligibility   | `0xb94B02ACbF4f6E511151b37506C8BbD19Dd8EbEf` |
| SemaphoreVerifier      | `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8` |
| EligibilityV0          | `0xE51BDfE6E09b4e37fd87e95cFB2Dd7C94f88AE24` |
| VoteStorageV0          | `0x22Bf9F62F0ec4a860adC292ace08E1825496A6aD` |
| ZkElGamalVoteVector    | `0x2089B3993cca3353005aC1258c52ac0C79853592` |
| ElgamalVoteVerifier    | `0xa3145aF3f4e20f171C4403f32f98687564Ac898d` |
| ElgamalTallyVerifier   | `0x1F2B17622d03BD38d2F4bb697c4b579Ac7E23114` |
| EntryPoint             | `0xC4018B2907a623E0490FEf5FeA3207aF954f34fF` |
| Paymaster              | `0x5BBC00f3F1FD7f1ab42Fed7b35f2DF2d25f7C76b` |
| SimpleAccount          | `0xCB06f2578A0EC8707a939dcc51cE381C84F444F2` |

### Base Sepolia (Chain ID 84532)

| Contract               | Address                                      |
| ---------------------- | -------------------------------------------- |
| VotingSystemEntryPoint | `0x5Ae7F0999f63b8B0803699B3e31545F6562910E6` |
| PollManager            | `0x9B90cB154fEaa5B51978148Fd6E6BfCABE83e671` |
| SemaphoreEligibility   | `0xB3ac11759Bd47d3bd288791b1723f73d953E9819` |
| SemaphoreVerifier      | `0x4DeC9E3784EcC1eE002001BfE91deEf4A48931f8` |
| EligibilityV0          | `0xfd0081c27c020C9daAb6Fa574E3B57c33c44B00F` |
| VoteStorageV0          | `0x4B62fDD46Cd5B26509F7b3143733CBfd7F6cE425` |
| ZkElGamalVoteVector    | `0x3F0a65C0b0d2118A909F7e148f677Afab14351c5` |
| ElgamalVoteVerifier    | `0x3BCC9f97a0873DfaCCcEA0AA2BBa14E7a06A6826` |
| ElgamalTallyVerifier   | `0x5Cd278Cc71A52383c603BE447277F3944974fddb` |
| EntryPoint             | `0x7ADBE3a5f57244428e2C2cbaE58cAEa3197d1A03` |
| Paymaster              | `0x16009E0EBd4AE0C5bBE0812C276944D33f5bc449` |
| SimpleAccount          | `0xE45B9CFb2C1B63244D91897718A1a6d5982eae32` |
