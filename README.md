# zkVote

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

### 1. Start the Local Blockchain

Start the local development chain (Anvil):

```bash
bun run dev:chain
```

Keep this terminal running.

### 2. Deploy the Contract

Open a new terminal and deploy the `VotingSystemMock` contract to your local chain:

```bash
forge create \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <YOUR_PRIVATE_KEY> \
  contracts/src/mock/VotingSystemMock.sol:VotingSystemMock \
  --broadcast
```

### 3. Start the Frontend

Start the frontend development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

### 4. Production Mode

To run the frontend in production mode:

1. Build the application:

```bash
bun run build
```

2. Start the production server:

```bash
bun run start
```

## Testing

Run the smart contract tests:

```bash
forge test
```
