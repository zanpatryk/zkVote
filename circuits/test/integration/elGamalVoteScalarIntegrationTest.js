const path = require("path");
const snarkjs = require("snarkjs");
const circomlibjs = require("circomlibjs");
const fs = require("fs");

const N_OPTIONS = 8;
const N_VOTERS = 5;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

async function integrationTest() {
    console.log("=== ElGamalVoteScalar Integration Test ===\n");
    console.log(`Options: ${N_OPTIONS}, Voters: ${N_VOTERS}\n`);

    const babyjub = await circomlibjs.buildBabyjub();
    const F = babyjub.F;
    const G = [
        F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
        F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
    ];

    // Paths
    const voteBuildDir = path.join(__dirname, "../../build/elGamalVoteScalar_N8");
    const voteSetupDir = path.join(voteBuildDir, "setup");
    const voteWasmPath = path.join(voteBuildDir, "elGamalVoteScalar_N8_js/elGamalVoteScalar_N8.wasm");
    const voteZkeyPath = path.join(voteSetupDir, "elGamalVoteScalar_N8_final.zkey");
    const voteVkeyPath = path.join(voteSetupDir, "verification_key.json");

    if (!fs.existsSync(voteZkeyPath)) {
        console.error(`${RED}Error: Vote key files not found. Run 'bun run setup' first.${RESET}`);
        process.exit(1);
    }

    const voteVkey = JSON.parse(fs.readFileSync(voteVkeyPath, "utf8"));

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
    
    // Votes: [0, 2, 2, 1, 2] -> Expected counts: Option 0: 1, Option 1: 1, Option 2: 3
    const voterChoices = [0, 2, 2, 1, 2];
    
    // Store encrypted votes for later decryption
    const encryptedVotes = [];

    for (let v = 0; v < N_VOTERS; v++) {
        const choice = voterChoices[v];
        const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;

        const input = {
            pk: toCircuitPoint(pubKey),
            selectedOption: choice.toString(),
            r: r.toString()
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, voteWasmPath, voteZkeyPath);
        
        // Verify the proof
        const verified = await snarkjs.groth16.verify(voteVkey, publicSignals, proof);
        if (!verified) {
            console.error(`${RED}Voter ${v}: Proof verification failed!${RESET}`);
            process.exit(1);
        }

        // Extract C1, C2 from public signals
        const c1 = [F.e(publicSignals[0]), F.e(publicSignals[1])];
        const c2 = [F.e(publicSignals[2]), F.e(publicSignals[3])];

        encryptedVotes.push({ c1, c2, expectedChoice: choice });
        console.log(`Voter ${v}: Voted for option ${choice} ${GREEN}(proof verified)${RESET}`);
    }

    // 3. Decryption Phase - decrypt each individual vote
    console.log("\n=== Phase 3: Individual Vote Decryption ===");

    const tally = new Array(N_OPTIONS).fill(0);

    for (let v = 0; v < N_VOTERS; v++) {
        const { c1, c2, expectedChoice } = encryptedVotes[v];
        
        // Decrypt: M = C2 - sk * C1
        const skC1 = babyjub.mulPointEscalar(c1, privKey);
        const negSkC1 = [F.neg(skC1[0]), skC1[1]];
        const M = babyjub.addPoint(c2, negSkC1);

        // M = selectedOption * G. Solve for selectedOption via brute force (small range)
        let decryptedChoice = -1;
        for (let t = 0; t < N_OPTIONS; t++) {
            const expected = babyjub.mulPointEscalar(G, BigInt(t));
            if (F.eq(M[0], expected[0]) && F.eq(M[1], expected[1])) {
                decryptedChoice = t;
                break;
            }
        }

        if (decryptedChoice === -1) {
            console.error(`${RED}Voter ${v}: Could not decrypt vote!${RESET}`);
            process.exit(1);
        }

        if (decryptedChoice !== expectedChoice) {
            console.error(`${RED}Voter ${v}: Decryption mismatch! Got ${decryptedChoice}, expected ${expectedChoice}${RESET}`);
            process.exit(1);
        }

        tally[decryptedChoice]++;
        console.log(`Voter ${v}: Decrypted choice = ${decryptedChoice} ${GREEN}OK${RESET}`);
    }

    // 4. Verify final tally
    console.log("\n=== Phase 4: Final Tally ===");
    for (let i = 0; i < N_OPTIONS; i++) {
        console.log(`Option ${i}: ${tally[i]} votes`);
    }

    const expected = [1, 1, 3, 0, 0, 0, 0, 0];
    let pass = true;
    for (let i = 0; i < N_OPTIONS; i++) {
        if (tally[i] !== expected[i]) pass = false;
    }

    if (!pass) {
        console.error(`\n${RED}FAILED: Tally mismatch!${RESET}`);
        process.exit(1);
    }
    console.log(`\n${GREEN}PASSED: Integration test complete!${RESET}`);
}

integrationTest().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
