#!/usr/bin/env node
/**
 * FFI Helper: Generate ElGamal Vote Vector proof for Foundry integration tests
 * 
 * Usage: node generate-vote-proof.mjs <pkX> <pkY> <selectedOption>
 * Output: Raw bytes - encVote[64] + proof.a[2] + proof.b[2][2] + proof.c[2] (72 x 32 = 2304 bytes)
 */
import * as snarkjs from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const N = 16;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

// Pad to 32 bytes hex (64 chars, no 0x prefix)
function pad32(value) {
    return BigInt(value).toString(16).padStart(64, '0');
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("Usage: node generate-vote-proof.mjs <pkX> <pkY> <selectedOption>");
        process.exit(1);
    }

    const pkX = args[0];
    const pkY = args[1];
    const selectedOption = parseInt(args[2]);

    // Paths to N=16 circuit artifacts
    const buildDir = path.join(__dirname, "../../../circuits/build/elGamalVoteVector_N16");
    const wasmPath = path.join(buildDir, "elGamalVoteVector_N16_js/elGamalVoteVector_N16.wasm");
    const zkeyPath = path.join(buildDir, "setup/elGamalVoteVector_N16_final.zkey");

    // Create one-hot vote vector
    const voteVector = new Array(N).fill(0);
    voteVector[selectedOption] = 1;

    // Generate random nonces
    const rVector = [];
    for (let i = 0; i < N; i++) {
        rVector.push((BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER).toString());
    }

    const input = {
        pk: [pkX, pkY],
        vote: voteVector.map(v => v.toString()),
        r: rVector
    };

    // Generate ZK proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

    // Build raw output bytes (no 0x prefix for direct stdout)
    // Format: encVote[64] (flattened) + proof.a[2] + proof.b[2][2] + proof.c[2]
    let hex = "";
    
    // encVote: first 64 public signals = [C1.x, C1.y, C2.x, C2.y] × 16 options
    for (let i = 0; i < 64; i++) {
        hex += pad32(publicSignals[i]);
    }
    
    // proof.a[2]
    hex += pad32(proof.pi_a[0]);
    hex += pad32(proof.pi_a[1]);
    
    // proof.b[2][2] - reversed for Solidity pairing precompile
    hex += pad32(proof.pi_b[0][1]);
    hex += pad32(proof.pi_b[0][0]);
    hex += pad32(proof.pi_b[1][1]);
    hex += pad32(proof.pi_b[1][0]);
    
    // proof.c[2]
    hex += pad32(proof.pi_c[0]);
    hex += pad32(proof.pi_c[1]);

    // Output raw hex bytes to stdout (Foundry FFI will read this)
    process.stdout.write(Buffer.from(hex, 'hex'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
