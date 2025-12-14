# zkVote

A voting application with privacy features.

## Prerequisites

- [Bun](https://bun.sh/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Installation

Install the dependencies:

```bash
bun install
```

## Running the Project

### Development Mode (Recommended)

To start the entire local environment (blockchain, contract deployment, and frontend) with a single command:

```bash
bun run dev:local
```

This script will:

1. Start a local Anvil blockchain instance.
2. Deploy the smart contracts to the local chain.
3. Generate the necessary ABIs and configuration.
4. Start the frontend development server.

The application will be available at `http://localhost:3000`.

### Manual Setup (Advanced)

If you prefer to run services individually:

1. **Start Blockchain**: `bun run dev:chain`
2. **Deploy Contracts**: `bun run deploy:local`
3. **Start Frontend**: `bun run dev:frontend`

### Production Build

1. **Build**: `bun run build`
2. **Start**: `bun run start`

## Testing

### Smart Contracts

Run the Forge tests for smart contracts:

```bash
bun run test:contracts
```

### Frontend UI

Run the frontend unit tests:

```bash
bun run test:ui
```

### Integration Tests

Run the frontend integration tests:

```bash
bun run test:ui:integration
```
