# zkVote Frontend

The web interface for zkVote, built with Next.js and Tailwind CSS. This application provides a seamless experience for creating polls, whitelisting voters, and casting anonymous votes using Zero-Knowledge Proofs.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Wallet Connection**: [RainbowKit](https://www.rainbowkit.com/) & [Wagmi](https://wagmi.sh/)
- **Privacy Logic**: [Semaphore Protocol](https://semaphore.appliedzkp.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Testing**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Project Structure

```text
src/
├── app/            # Next.js pages and layouts
│   ├── home/       # Dashboard and poll discovery
│   ├── poll/       # Poll management and voting
│   ├── verify/     # Proof verification utility
│   └── vote/       # Direct voting interface
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks (e.g., useSemaphore)
├── lib/            # Core logic and utilities
│   ├── blockchain/ # Viem/Wagmi configurations
│   ├── contracts/  # Generated ABIs and address constants
│   └── providers/  # React context providers
└── styles/         # Global styles and Tailwind config
```

## Getting Started

### Installation

Ensure you have installed dependencies from the root directory:

```bash
bun install
```

### Environment Variables

Create a `.env.local` file in the `frontend/` directory with the following variables:

```bash
# Required: WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id

# Required for gasless voting: Private key for the bundler account that signs UserOperations
BUNDLER_PRIVATE_KEY=0xYourPrivateKey

# Optional: CDN URL for ZK circuit artifacts (wasm/zkey files)
# If not set, local files from /public/circuits will be used
NEXT_PUBLIC_CDN_URL=https://your-cdn-url.example.com

# Optional: Custom RPC URLs (defaults to public endpoints)
# NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
# NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Circuit Setup (CDN vs Local)

The frontend requires ZK artifacts (`.wasm` and `.zkey` files) to generate proofs in the browser. By default, these are fetched from a **CDN** for faster loading.

#### Option 1: Use CDN (Recommended for Production)

Set the `NEXT_PUBLIC_CDN_URL` environment variable to your CDN hosting the circuit artifacts. The production deployment uses Cloudflare R2.

#### Option 2: Use Local Files (Development)

To use locally compiled circuits instead of CDN:

1. Set `USE_LOCAL_ZKVOTE_CIRCUITS = true` in `src/lib/constants.js`
2. Set `USE_LOCAL_SEMAPHORE_CIRCUITS = true` if you want local Semaphore circuits as well
3. Run the setup script to copy artifacts to the public folder:

```bash
bun run setup:circuits
```

This script:

1. Downloads Semaphore artifacts from the PSE CDN.
2. Copies locally compiled ElGamal/Tally artifacts from the `circuits/build` directory.

### Development

Run the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## Scripts

- `bun run dev`: Starts the development server.
- `bun run build`: Creates an optimized production build.
- `bun run start`: Starts the production server.
- `bun run lint`: Runs ESLint to check for code quality issues.
- `bun run test:ui`: Runs unit tests with Jest.
- `bun run test:ui:watch`: Runs unit tests in watch mode.
- `bun run test:ui:coverage`: Generates a test coverage report.
- `bun run test:ui:integration`: Runs specific UI integration tests.
- `bun run setup:circuits`: Runs both download and copy scripts to prepare local ZK artifacts.
- `bun run download:circuits`: Downloads Semaphore ZK artifacts from the PSE CDN.
- `bun run copy:circuits`: Copies locally compiled ElGamal/Tally artifacts from the `circuits/` package.

## Account Abstraction (Gasless Voting)

The frontend supports gasless voting via ERC-4337 Account Abstraction. This requires:

1. **`BUNDLER_PRIVATE_KEY`**: The private key that signs UserOperations on behalf of voters.
2. **Paymaster Contract**: The `PollSponsorPaymaster` contract must be deployed and funded by poll creators.

> **Important**: The `BUNDLER_PRIVATE_KEY` must correspond to the **owner** of the deployed `zkVoteSimpleAccount` contract. The smart account verifies that UserOperations are signed by its owner before executing. You cannot use an arbitrary key—it must match the address set during contract deployment.

When a user casts a vote, the frontend constructs a UserOperation and sends it to the `/api/bundler` endpoint, which signs and submits the transaction to the EntryPoint contract.

## Testing

We use Jest and React Testing Library for verifying component behavior and application logic.

```bash
# Run all unit tests
bun run test:ui

# Run integration tests
bun run test:ui:integration

# Generate coverage report
bun run test:ui:coverage
```

### Coverage

The coverage report provides details on which lines of code are exercised by our tests.

- **Console Output**: A summary table is printed to the terminal after running the coverage command.
- **HTML Report**: A detailed interactive report is generated in the `frontend/coverage/lcov-report/index.html` directory. Open this file in your browser to explore line-by-line coverage.

Unit tests are located alongside the components or pages they test (e.g., `PollCard.test.jsx`). Integration tests are located in the `tests/` directory.
