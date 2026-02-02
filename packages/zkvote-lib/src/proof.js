/**
 * ZK proof generation and verification utilities
 */

import * as snarkjs from "snarkjs";

/**
 * Generate a Groth16 proof
 * @param {Object} input - Circuit input signals
 * @param {Object} snarkArtifacts - Paths to circuit artifacts
 * @param {string} snarkArtifacts.wasmFilePath - Path to circuit .wasm file
 * @param {string} snarkArtifacts.zkeyFilePath - Path to circuit .zkey file
 * @returns {Promise<{ proof: Object, publicSignals: string[] }>}
 */
export async function generateProof(input, snarkArtifacts) {
    const { wasmFilePath, zkeyFilePath } = snarkArtifacts;
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmFilePath, zkeyFilePath);
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
