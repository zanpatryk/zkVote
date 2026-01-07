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

### Circuit Setup

The frontend requires Semaphore ZK artifacts (`.wasm` and `.zkey` files) to generate proofs in the browser. You must download these before the application can function correctly:

```bash
bun run download:circuits
```

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
- `bun run download:circuits`: Downloads Semaphore ZK artifacts for the frontend.

## Testing

We use Jest and React Testing Library for verifying component behavior and application logic.

```bash
# Run all unit tests
bun run test:ui

# Run integration tests
bun run test:ui:integration
```

Unit tests are located alongside the components or pages they test (e.g., `PollCard.test.jsx`). Integration tests are located in the `tests/` directory.
