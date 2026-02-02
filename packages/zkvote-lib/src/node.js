/**
 * Node.js-only utilities for zkvote-lib
 * These should not be imported by the frontend.
 */

import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

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
    const snarkjsPath = path.dirname(require.resolve("snarkjs"));
    const templatePath = path.join(snarkjsPath, "templates", "verifier_groth16.sol.ejs");
    return fs.readFileSync(templatePath, "utf8");
}
