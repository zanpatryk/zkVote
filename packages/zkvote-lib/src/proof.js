/**
 * ZK proof generation and verification utilities
 */

import * as snarkjs from "snarkjs";

/**
 * Generate a Groth16 proof
 * @param {Object} input - Circuit input signals
 * @param {string} wasmPath - Path to circuit .wasm file
 * @param {string} zkeyPath - Path to circuit .zkey file
 * @returns {Promise<{ proof: Object, publicSignals: string[] }>}
 */
export async function generateProof(input, wasmPath, zkeyPath) {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    return { proof, publicSignals };
}

/**
 * Verify a Groth16 proof
 * @param {Object} vkey - Verification key (JSON object)
 * @param {string[]} publicSignals - Public signals from proof
 * @param {Object} proof - Proof object
 * @returns {Promise<boolean>}
 */
export async function verifyProof(vkey, publicSignals, proof) {
    return snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/**
 * Export Solidity verifier from zkey
 * @param {string} zkeyPath - Path to .zkey file
 * @returns {Promise<string>} - Solidity source code
 */
export async function exportSolidityVerifier(zkeyPath) {
    const templates = {
        groth16: await getGroth16Template()
    };
    return snarkjs.zKey.exportSolidityVerifier(zkeyPath, templates);
}

async function getGroth16Template() {
    // Use snarkjs's built-in template
    const fs = await import("fs");
    const path = await import("path");
    const snarkjsPath = path.dirname(require.resolve("snarkjs"));
    const templatePath = path.join(snarkjsPath, "templates", "verifier_groth16.sol.ejs");
    return fs.readFileSync(templatePath, "utf8");
}

/**
 * Format proof for Solidity contract call
 * @param {Object} proof - Proof from snarkjs
 * @returns {{ a: string[], b: string[][], c: string[] }}
 */
export function formatProofForSolidity(proof) {
    return {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]]
    };
}

/**
 * Format public signals for Solidity contract call
 * @param {string[]} publicSignals
 * @returns {string[]}
 */
export function formatSignalsForSolidity(publicSignals) {
    return publicSignals.map(s => s.toString());
}
