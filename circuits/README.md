# Zero-Knowledge Voting Circuits

Circom circuits for the zkVote protocol implementing privacy-preserving voting with homomorphic tallying.

## Circuits

| Circuit             | Purpose                                       | Tally Method                        |
| ------------------- | --------------------------------------------- | ----------------------------------- |
| `pedersenVote`      | Pedersen Commitment voting                    | Aggregate + reveal blinders         |
| `elgamalVoteVector` | ElGamal encrypted voting (N ciphertexts)      | Decrypt with private key            |
| `elgamalVoteSingle` | Scalable ElGamal voting (1 ciphertext + hash) | Decrypt with private key            |
| `elgamalDecrypt`    | ZK proof of correct decryption                | Proves tally without revealing `sk` |

## Prerequisites

- **Bun** (Package Manager)
- **Node.js** (For snarkjs)
- **Circom** → [Install](https://docs.circom.io/getting-started/installation/)

## Quick Start

```bash
cd circuits
bun install
bun run build            # Compile all circuits from config
bun run setup            # Trusted setup for all circuits
bun run test             # Run all unit tests
bun run test:integration # Run integration tests
```

## Configuration

All circuit builds are defined in `circuits.config.json`:

```json
{
  "builds": {
    "testing": [
      { "circuit": "pedersenVote", "params": { "N": 8 } },
      { "circuit": "elgamalVoteVector", "params": { "N": 8 } },
      { "circuit": "elgamalVoteSingle", "params": { "N": 8 } },
      { "circuit": "elgamalDecrypt", "params": { "N": 8 } }
    ],
    "elgamalSingle32": [
      { "circuit": "elgamalVoteSingle", "params": { "N": 32 } },
      { "circuit": "elgamalDecrypt", "params": { "N": 32 } }
    ]
  }
}
```

Build names follow the pattern: `{circuit}_{params}` (e.g., `elgamalVoteSingle_N8`, `elgamalDecrypt_N32`)

## Build Output

```
build/
├── pedersenVote_N8/
│   ├── pedersenVote_N8.r1cs
│   ├── pedersenVote_N8_js/
│   │   └── pedersenVote_N8.wasm
│   └── setup/
│       ├── pedersenVote_N8_final.zkey
│       └── verification_key.json
├── elgamalVoteSingle_N8/
├── elgamalVoteSingle_N32/
├── elgamalDecrypt_N8/
├── elgamalDecrypt_N32/
└── elgamalVoteVector_N8/
```

## Scripts

| Script             | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `build`            | Compile all circuits from `circuits.config.json`                   |
| `setup`            | Trusted setup for all configured circuits (auto-detects PTAU size) |
| `test`             | All unit tests                                                     |
| `test:integration` | Full end-to-end tests                                              |

**Note:** The setup script automatically downloads the appropriate Powers of Tau file based on constraint count (pot14-pot28).

## Circuit Details

### Pedersen Commitment (`pedersenVote`)

- **Formula**: $C = vote \cdot G + blinder \cdot H$
- **Tally**: Homomorphic aggregation, reveal sum of blinders

### ElGamal Vector (`elgamalVoteVector`)

- **Output**: N ciphertexts (one per option)
- **Formula**: $C_1 = r \cdot G$, $C_2 = r \cdot PK + vote \cdot G$
- **Constraints**: ~81K for N=8

### ElGamal Single (`elgamalVoteSingle`)

- **Output**: 1 ciphertext + optionHash (constant size regardless of N)
- **Formula**: Same encryption, hash routes vote to bucket
- **Constraints**: ~11K (constant)

### Decryption Proof (`elgamalDecrypt`)

- **Proves**: `tally[i] * G == aggC2[i] - sk * aggC1[i]`
- **Without revealing**: Secret key `sk`
- **Constraints**: ~54K for N=8, ~210K for N=32

## File Structure

```
src/
├── pedersenVote.circom      # Pedersen commitment voting
├── elgamal.circom           # ElGamal encryption template
├── elgamalVoteVector.circom # ElGamal vector voting
├── elgamalVoteSingle.circom # Scalable single-ciphertext voting
└── elgamalDecrypt.circom    # Decryption proof circuit

test/
├── unit/
│   ├── pedersenVoteTest.js
│   ├── elgamalTest.js
│   ├── elgamalVoteVectorTest.js
│   ├── elgamalVoteSingleTest.js
│   └── elgamalDecryptTest.js
└── integration/
    ├── pedersenVoteIntegrationTest.js
    ├── elgamalVectorIntegrationTest.js
    └── elgamalSingleIntegrationTest.js

scripts/
├── build.js    # Compiles circuits from config
└── setup.js    # Trusted setup with auto PTAU detection
```

## Cryptographic Parameters

- **Curve**: BabyJubJub (Twisted Edwards)
- **Generator G**: Base8 point
- **Generator H**: Independent NUMS point (Pedersen only)
