# Zero-Knowledge Voting Circuits

Circom circuits for the zkVote protocol implementing privacy-preserving voting with homomorphic tallying.

## Circuits

| Circuit               | Purpose                                         | Tally Method                        |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| `pedersenVoteVector`  | Pedersen Commitment voting                      | Aggregate + reveal blinders         |
| `elGamalVoteVector`   | ElGamal encrypted voting (N ciphertexts)        | Homomorphic aggregation + decrypt   |
| `elGamalVoteScalar`   | Scalable ElGamal voting (1 ciphertext per vote) | Individual decryption               |
| `elGamalTallyDecrypt` | ZK proof of correct tally decryption            | Proves tally without revealing `sk` |
| `elGamalDecrypt`      | Base decryption proof template                  | Used by TallyDecrypt                |

## Prerequisites

- **Bun** (Package Manager)
- **Node.js** (For snarkjs)
- **Rust** - Required for Circom ([Install](https://www.rust-lang.org/tools/install))
- **Circom** - ZK circuit compiler ([Install](https://docs.circom.io/getting-started/installation/))

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
      { "circuit": "pedersenVoteVector", "params": { "N": 8 } },
      { "circuit": "elGamalVoteVector", "params": { "N": 8 } },
      { "circuit": "elGamalVoteScalar", "params": { "N": 8 } },
      { "circuit": "elGamalTallyDecrypt", "params": { "N": 8 } }
    ],
    "verifiers": [
      { "circuit": "elGamalVoteScalar", "params": { "N": 8 } },
      { "circuit": "elGamalVoteScalar", "params": { "N": 16 } },
      { "circuit": "elGamalTallyDecrypt", "params": { "N": 8 } },
      { "circuit": "elGamalTallyDecrypt", "params": { "N": 16 } }
    ]
  }
}
```

Build names follow the pattern: `{circuit}_{params}` (e.g., `elGamalVoteScalar_N8`, `elGamalTallyDecrypt_N32`)

## Build Output

```
build/
├── pedersenVoteVector_N8/
│   ├── pedersenVoteVector_N8.r1cs
│   ├── pedersenVoteVector_N8_js/
│   │   └── pedersenVoteVector_N8.wasm
│   └── setup/
│       ├── pedersenVoteVector_N8_final.zkey
│       └── verification_key.json
├── elGamalVoteScalar_N8/
├── elGamalVoteScalar_N16/
├── elGamalTallyDecrypt_N8/
├── elGamalTallyDecrypt_N16/
└── elGamalVoteVector_N8/
```

## Scripts

| Script               | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `build`              | Compile all circuits from `circuits.config.json`                   |
| `setup`              | Trusted setup for all configured circuits (auto-detects PTAU size) |
| `test`               | All unit tests                                                     |
| `test:integration`   | Full end-to-end tests                                              |
| `generate:verifiers` | Generate Solidity verifier contracts                               |

**Note:** The setup script automatically downloads the appropriate Powers of Tau file based on constraint count (pot14-pot28).

## Circuit Details

### Pedersen Commitment (`pedersenVoteVector`)

- **Formula**: `C = vote * G + blinder * H`
- **Tally**: Homomorphic aggregation, reveal sum of blinders
- **Constraints**: ~63K for N=8

### ElGamal Vector (`elGamalVoteVector`)

- **Output**: N ciphertexts (one per option as one-hot encoded)
- **Formula**: `C1 = r * G`, `C2 = r * PK + vote * G`
- **Constraints**: ~81K for N=8
- **Use case**: Fully homomorphic aggregation on-chain

### ElGamal Scalar (`elGamalVoteScalar`)

- **Output**: 1 ciphertext (encrypts selected option index)
- **Formula**: Same encryption as vector
- **Constraints**: ~10K (constant regardless of N)
- **Use case**: Individual vote decryption

### Tally Decryption Proof (`elGamalTallyDecrypt`)

- **Proves**: `tally[i] * G == aggC2[i] - sk * aggC1[i]` for all options
- **Without revealing**: Secret key `sk`
- **Uses**: Base `ElGamalDecrypt` template for each option
- **Constraints**: ~81K for N=8, ~650K for N=64

### Base Decryption (`elGamalDecrypt`)

- **Proves**: Correct decryption of a single ciphertext
- **Template only**: No main component (used by TallyDecrypt)

## File Structure

```
src/
├── pedersenCommitment.circom   # Pedersen commitment template
├── pedersenVoteVector.circom   # Pedersen commitment voting
├── elGamal.circom              # ElGamal encryption template
├── elGamalVoteVector.circom    # ElGamal vector voting
├── elGamalVoteScalar.circom    # Scalable single-ciphertext voting
├── elGamalDecrypt.circom       # Base decryption proof template
└── elGamalTallyDecrypt.circom  # Tally decryption proof circuit

test/
├── unit/
│   ├── pedersenVoteVectorTest.js
│   ├── elGamalVoteVectorTest.js
│   ├── elGamalVoteVectorEncryptionTest.js
│   ├── elGamalVoteScalarTest.js
│   └── elGamalTallyDecryptTest.js
└── integration/
    ├── pedersenVoteVectorIntegrationTest.js
    ├── elGamalVoteVectorIntegrationTest.js
    └── elGamalVoteScalarIntegrationTest.js

scripts/
├── build.js              # Compiles circuits from config
├── setup.js              # Trusted setup with auto PTAU detection
└── generate-verifiers.js # Generate Solidity verifiers
```

## Cryptographic Parameters

- **Curve**: BabyJubJub (Twisted Edwards)
- **Generator G**: Base8 point
- **Generator H**: Independent NUMS point (Pedersen only)
- **Subgroup Order**: `2736030358979909402780800718157159386076813972158567259200215660948447373041`
