import { generateProof, verifyProof, formatProofForSolidity } from "../src/proof.js";
import { init, generateKeyPair, randomScalar } from "../src/elgamal.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Updated path to reflect new naming convention
const ARTIFACTS_DIR = path.resolve(__dirname, "../../../circuits/build/elGamalVoteScalar_N8");
const WASM_PATH = path.join(ARTIFACTS_DIR, "elGamalVoteScalar_N8_js/elGamalVoteScalar_N8.wasm");
const ZKEY_PATH = path.join(ARTIFACTS_DIR, "setup/elGamalVoteScalar_N8_final.zkey");
const VKEY_PATH = path.join(ARTIFACTS_DIR, "setup/verification_key.json");

async function runTests() {
    console.log("Running ZK Proof Tests (Node.js)...");

    let vkey;
    // Init matchers/setup
    await init();
    
    if (fs.existsSync(VKEY_PATH)) {
        vkey = JSON.parse(fs.readFileSync(VKEY_PATH, "utf-8"));
    } else {
        console.warn(`Skipping proof tests: Artifacts not found at ${VKEY_PATH}`);
        return;
    }

    // Test 1: Generate and Verify
    try {
        console.log("Test: Generate and verify valid proof");
        const { pk } = generateKeyPair();
        const r = randomScalar();
        const input = {
            pk: [pk[0].toString(), pk[1].toString()],
            r: r.toString(),
            selectedOption: "1" 
        };
        const result = await generateProof(input, WASM_PATH, ZKEY_PATH);
        assert(result.proof, "Proof undefined");
        assert(result.publicSignals, "Signals undefined");
        
        const isValid = await verifyProof(vkey, result.publicSignals, result.proof);
        assert.strictEqual(isValid, true, "Proof verification failed");
        console.log("PASS");
    } catch (e) {
        console.error("FAIL:", e);
        process.exit(1);
    }

    // Test 2: Formatting
    try {
        console.log("Test: Format for Solidity");
        const mockProof = {
            pi_a: ["a0", "a1", "a2"],
            pi_b: [["b00", "b01"], ["b10", "b11"], ["b20", "b21"]],
            pi_c: ["c0", "c1", "c2"]
        };
        const solProof = formatProofForSolidity(mockProof);
        assert.strictEqual(solProof.a[0], "a0");
        assert.strictEqual(solProof.b[0][0], "b01");
        console.log("PASS");
    } catch (e) {
        console.error("FAIL:", e);
        process.exit(1);
    }
}

runTests();
