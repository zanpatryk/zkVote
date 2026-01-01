# Zero-Knowledge Voting Circuits

This directory contains the Circom circuits for the zkVote protocol. It implements a privacy-preserving voting system using **Pedersen Commitments** on the **BabyJubJub** elliptic curve, enabling **additive homomorphic tallying**.

## Features

- **Anonymous Voting**: Votes are encrypted as Pedersen Commitments ($C = vote \cdot G + blinder \cdot H$).
- **Homomorphic Tallying**: Votes can be aggregated on-chain without decryption.
  - $\sum C_i = (\sum v_i) \cdot G + (\sum b_i) \cdot H$
  - The tally is verified by revealing the sum of blinders ($\sum b_i$).
- **Validity Proofs**: The circuit proves:
  - The vote is valid (essentially a one-hot vector for standard voting).
  - The commitment matches the vote.
  - The voter knows the private key (signature verification - _planned/implicit_).

## Prerequisites

- **Bun** (Package Manager)
- **Node.js** (Required for `snarkjs`)
- **Circom** (Compiler) -> [Install Instructions](https://docs.circom.io/getting-started/installation/)

## Setup

1.  **Install Dependencies**:

    ```bash
    cd circuits
    bun install
    ```

2.  **Build Circuits**:
    Compiles the `.circom` files to R1CS and WASM.

    ```bash
    bun run build
    ```

3.  **Trusted Setup**:
    Downloads the Powers of Tau (PTAU) file, generates the zKey, and exports the verification key.
    ```bash
    bun run setup
    ```

## Testing

### Unit Tests

Runs standard validity checks (valid votes, invalid votes, constraint checks).

```bash
bun run test
```

### Integration Tests

Simulates a full election cycle with multiple voters, commitment aggregation, and homomorphic tally verification.

```bash
bun run test:integration
```

## Circuit Details

### `secretVote.circom`

- **Parameters**: `N` options (default: 8).
- **Public Inputs**:
  - `commitments[N][2]`: The Pedersen Commitments for each option.
- **Private Inputs**:
  - `vote[N]`: One-hot vector representing the vote (e.g., `[0, 1, 0, ...]`).
  - `blinder[N]`: Random blinding factors for each commitment.
- **Constraints**:
  1.  **Binary Check**: Each vote element must be 0 or 1.
  2.  **One-Hot Check**: The sum of the vote vector must be exactly 1.
  3.  **Commitment Verification**: Checks that $C_i = v_i \cdot G + b_i \cdot H$.

### Cryptographic Parameters

- **Curve**: BabyJubJub (Twisted Edwards form).
- **Generator G (Vote Base)**: Standard Base8 point.
  - X: `5299619240641551281634865583518297030282874472190772894086521144482721001553`
  - Y: `16950150798460657717958625567821834550301663161624707787222815936182638968203`
- **Generator H (Blinder Base)**: Independent NUMS point.
  - X: `17777552123799933955779906779655732241715742912184938656739573121738514868268`
  - Y: `2626589144620713026669568689430873010625803728049924121243784502389097019475`
- **Scalar Multiplication**: Uses `EscalarMulFix` for optimized constraints.

## Configuration

To change the number of voting options:

1.  Edit `secretVote.circom`: Change `SecretVote(8)` to your desired `N`.
2.  Update tests (`test/secretVoteTest.js`, `test/integrationTest.js`) to match the new `N`.
3.  If `N` is large (e.g., >16), you may need a larger PTAU file (e.g., `pot18` or `pot19`). Update `scripts/setup.js` accordingly.
