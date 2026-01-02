const path = require("path");
const snarkjs = require("snarkjs");
const circomlibjs = require("circomlibjs");
const fs = require("fs");

const N_OPTIONS = 8;
const N_VOTERS = 5;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

async function integrationTest() {
    console.log("=== ElGamalVoteSingle Integration Test ===\n");
    console.log(`Options: ${N_OPTIONS}, Voters: ${N_VOTERS}\n`);

    const babyjub = await circomlibjs.buildBabyjub();
    const poseidon = await circomlibjs.buildPoseidon();
    const F = babyjub.F;
    const G = [
        F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
        F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
    ];

    // Paths
    const voteBuildDir = path.join(__dirname, "../../build/elgamalVoteSingle_N8");
    const voteSetupDir = path.join(voteBuildDir, "setup");
    const voteWasmPath = path.join(voteBuildDir, "elgamalVoteSingle_N8_js/elgamalVoteSingle_N8.wasm");
    const voteZkeyPath = path.join(voteSetupDir, "elgamalVoteSingle_N8_final.zkey");

    const decryptBuildDir = path.join(__dirname, "../../build/elgamalDecrypt_N8");
    const decryptSetupDir = path.join(decryptBuildDir, "setup");
    const decryptWasmPath = path.join(decryptBuildDir, "elgamalDecrypt_N8_js/elgamalDecrypt_N8.wasm");
    const decryptZkeyPath = path.join(decryptSetupDir, "elgamalDecrypt_N8_final.zkey");
    const decryptVkeyPath = path.join(decryptSetupDir, "verification_key.json");

    if (!fs.existsSync(voteZkeyPath)) {
        console.error("Error: Vote key files not found. Run 'bun run setup:elgamalVoteSingle' first.");
        process.exit(1);
    }
    if (!fs.existsSync(decryptZkeyPath)) {
        console.error("Error: Decrypt key files not found. Run 'bun run setup:elgamalDecrypt' first.");
        process.exit(1);
    }

    const decryptVkey = JSON.parse(fs.readFileSync(decryptVkeyPath, "utf8"));

    function toCircuitPoint(point) {
        return [F.toObject(point[0]).toString(), F.toObject(point[1]).toString()];
    }

    // 1. Key Generation
    console.log("=== Phase 1: Key Generation ===");
    const privKey = BigInt(Math.floor(Math.random() * 100000000000)) % SUBORDER;
    const pubKey = babyjub.mulPointEscalar(G, privKey);
    console.log("Owner Public Key generated\n");

    // 2. Voting Phase
    console.log("=== Phase 2: Voters Cast Votes ===");
    
    // Votes: [0, 2, 2, 1, 2] -> Option 0: 1, Option 1: 1, Option 2: 3
    const voterChoices = [0, 2, 2, 1, 2];
    
    // Store ciphertexts by option
    const ciphertextsByOption = {};
    for (let i = 0; i < N_OPTIONS; i++) {
        ciphertextsByOption[i] = { c1: [F.zero, F.one], c2: [F.zero, F.one] };
    }

    // Precompute option hashes
    const optionHashes = {};
    for (let i = 0; i < N_OPTIONS; i++) {
        optionHashes[i] = poseidon.F.toString(poseidon([BigInt(i)]));
    }

    for (let v = 0; v < N_VOTERS; v++) {
        const choice = voterChoices[v];
        const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;

        const input = {
            pk: toCircuitPoint(pubKey),
            selectedOption: choice.toString(),
            r: r.toString()
        };

        const { publicSignals } = await snarkjs.groth16.fullProve(input, voteWasmPath, voteZkeyPath);

        // Extract C1, C2, optionHash from public signals
        const c1 = [F.e(publicSignals[0]), F.e(publicSignals[1])];
        const c2 = [F.e(publicSignals[2]), F.e(publicSignals[3])];
        const outputHash = publicSignals[4];

        // Find which option this hash matches
        let matchedOption = -1;
        for (let i = 0; i < N_OPTIONS; i++) {
            if (optionHashes[i] === outputHash) {
                matchedOption = i;
                break;
            }
        }

        if (matchedOption === -1) {
            console.error(`Voter ${v}: Unknown option hash!`);
            process.exit(1);
        }

        // Aggregate ciphertext
        ciphertextsByOption[matchedOption].c1 = babyjub.addPoint(ciphertextsByOption[matchedOption].c1, c1);
        ciphertextsByOption[matchedOption].c2 = babyjub.addPoint(ciphertextsByOption[matchedOption].c2, c2);

        console.log(`Voter ${v}: Voted for option ${matchedOption} ✓`);
    }

    // 3. Decryption & Tally
    console.log("\n=== Phase 3: Decryption & Tally ===");

    const finalCounts = new Array(N_OPTIONS).fill(0);
    const aggC1 = [];
    const aggC2 = [];

    for (let i = 0; i < N_OPTIONS; i++) {
        aggC1.push(toCircuitPoint(ciphertextsByOption[i].c1));
        aggC2.push(toCircuitPoint(ciphertextsByOption[i].c2));

        const C1 = ciphertextsByOption[i].c1;
        const C2 = ciphertextsByOption[i].c2;
        
        const skC1 = babyjub.mulPointEscalar(C1, privKey);
        const negSkC1 = [F.neg(skC1[0]), skC1[1]];
        const M = babyjub.addPoint(C2, negSkC1);

        let count = -1;
        for (let t = 0; t <= N_VOTERS; t++) {
            const expected = babyjub.mulPointEscalar(G, BigInt(t));
            if (F.eq(M[0], expected[0]) && F.eq(M[1], expected[1])) {
                count = t;
                break;
            }
        }

        finalCounts[i] = count >= 0 ? count : 0;
        console.log(`Option ${i}: ${finalCounts[i]} votes`);
    }

    // 4. Verify tally
    const expected = [1, 1, 3, 0, 0, 0, 0, 0];
    let pass = true;
    for (let i = 0; i < N_OPTIONS; i++) {
        if (finalCounts[i] !== expected[i]) pass = false;
    }

    if (!pass) {
        console.error("\n❌ Tally mismatch!");
        process.exit(1);
    }
    console.log("\n✅ Tally matches expected votes!");

    // 5. ZK Decryption Proof
    console.log("\n=== Phase 4: ZK Decryption Proof ===");

    const decryptInput = {
        pk: toCircuitPoint(pubKey),
        aggC1: aggC1,
        aggC2: aggC2,
        tally: finalCounts.map(t => t.toString()),
        sk: privKey.toString()
    };

    console.log("Generating decryption proof...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        decryptInput,
        decryptWasmPath,
        decryptZkeyPath
    );
    console.log("✓ Decryption proof generated");

    const verified = await snarkjs.groth16.verify(decryptVkey, publicSignals, proof);
    if (verified) {
        console.log("✓ Decryption proof verified!");
    } else {
        console.error("❌ Decryption proof verification failed!");
        process.exit(1);
    }

    console.log("\n✅ Integration test PASSED!");
}

integrationTest().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
