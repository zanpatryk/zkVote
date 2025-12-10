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

Open a new terminal and deploy the contracts to your local chain:

```bash
bun run deploy:local
```

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory with the following content:

```bash
NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_POLL_MANAGER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_ELIGIBILITY_MODULE_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_VOTE_STORAGE_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

### 4. Start the Frontend

Start the frontend development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

### 5. Production Mode

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
bun run test:contracts
```
