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
    console.log("=== Homomorphic ElGamal Vote Tallying Integration Test ===\n");
    console.log(`Options: ${N_OPTIONS}, Voters: ${N_VOTERS}\n`);

    const circomlibjs = require("circomlibjs");
    const babyjub = await circomlibjs.buildBabyjub();
    const F = babyjub.F;
    const G = babyjub.Base8;

    // Paths
    const buildDir = path.join(__dirname, "../../build/elGamalVoteVector_N8");
    const setupDir = path.join(buildDir, "setup");
    const wasmPath = path.join(buildDir, "elGamalVoteVector_N8_js/elGamalVoteVector_N8.wasm");
    const zkeyPath = path.join(setupDir, "elGamalVoteVector_N8_final.zkey");
    const vkeyPath = path.join(setupDir, "verification_key.json");

    if (!fs.existsSync(zkeyPath)) {
        console.error(`${RED}Error: Key files not found. Run 'bun run setup' first.${RESET}`);
        process.exit(1);
    }
    
    // 1. Setup Phase: Poll Owner generates Keys
    console.log("=== Phase 1: Key Generation ===");
    const privKey = BigInt(Math.floor(Math.random() * 100000000000)) % SUBORDER;
    const pubKey = babyjub.mulPointEscalar(G, privKey);
    console.log(`Owner Private Key: [Hidden]`);
    console.log(`Owner Public Key: (${F.toObject(pubKey[0])}, ${F.toObject(pubKey[1])})`);
    
    // 2. Voting Phase
    console.log("\n=== Phase 2: Voters Cast Encrypted Votes ===");
    
    // Define votes: [0, 2, 2, 1, 2] -> Option 0: 1, Option 1: 1, Option 2: 3
    const voterChoices = [0, 2, 2, 1, 2];
    const encryptedVotes = []; 
    
    for (let v = 0; v < N_VOTERS; v++) {
        const choice = voterChoices[v];
        const voteVector = new Array(N_OPTIONS).fill(0);
        voteVector[choice] = 1;
        
        // Randomness (nonce)
        const rVector = [];
        for(let i=0; i<N_OPTIONS; i++) rVector.push(BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER);
        
        const input = {
            pk: [F.toObject(pubKey[0]), F.toObject(pubKey[1])],
            vote: voteVector,
            r: rVector
        };
        
        // Generate Proof (and get public signals which contain output ciphertexts)
        const { publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        
        // Extract Ciphertexts from Public Signals
        const ciphertexts = [];
        let offset = 0;
        for (let i = 0; i < N_OPTIONS; i++) {
             const c1 = [
                F.e(publicSignals[offset]), 
                F.e(publicSignals[offset+1])
             ];
             const c2 = [
                F.e(publicSignals[offset+2]),
                F.e(publicSignals[offset+3])
             ];
             ciphertexts.push({ c1, c2 });
             offset += 4;
        }
        
        encryptedVotes.push(ciphertexts);
        console.log(`Voter ${v}: Voted for option ${choice} (Encrypted & Proved)`);
    }
    
    // 3. Aggregation Phase
    console.log("\n=== Phase 3: Homomorphic Aggregation ===");
    
    const ZeroPoint = [F.zero, F.one];
    
    const aggregatedCiphertexts = [];
    for (let i = 0; i < N_OPTIONS; i++) {
        aggregatedCiphertexts.push({
            c1: ZeroPoint,
            c2: ZeroPoint
        });
    }
    
    for (let v = 0; v < N_VOTERS; v++) {
        for (let i = 0; i < N_OPTIONS; i++) {
            aggregatedCiphertexts[i].c1 = babyjub.addPoint(aggregatedCiphertexts[i].c1, encryptedVotes[v][i].c1);
            aggregatedCiphertexts[i].c2 = babyjub.addPoint(aggregatedCiphertexts[i].c2, encryptedVotes[v][i].c2);
        }
    }
    console.log("Ciphertexts aggregated on-chain.");
    
    // 4. Tally Phase
    console.log("\n=== Phase 4: Decryption & Tally ===");
    
    const finalCounts = new Array(N_OPTIONS).fill(0);
    
    for (let i = 0; i < N_OPTIONS; i++) {
        const C1 = aggregatedCiphertexts[i].c1;
        const C2 = aggregatedCiphertexts[i].c2;
        
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
        
        if (count === -1) {
            console.error(`${RED}Error: Could not decrypt count for Option ${i}.${RESET}`);
            console.log(`Point: ${F.toObject(M[0])}, ${F.toObject(M[1])}`);
        } else {
            finalCounts[i] = count;
            console.log(`Option ${i}: ${count} votes`);
        }
    }
    
    // Verify
    const expected = [1, 1, 3, 0, 0, 0, 0, 0];
    let pass = true;
    for(let i=0; i<N_OPTIONS; i++) {
        if(finalCounts[i] !== expected[i]) pass = false;
    }
    
    if (pass) {
        console.log(`\n${GREEN}Tally matches expected votes!${RESET}`);
    } else {
        console.error(`\n${RED}FAILED: Tally mismatch.${RESET}`);
        process.exit(1);
    }

    // 5. Decryption Proof Phase
    console.log("\n=== Phase 5: ZK Decryption Proof ===");

    const decryptBuildDir = path.join(__dirname, "../../build/elGamalTallyDecrypt_N8");
    const decryptSetupDir = path.join(decryptBuildDir, "setup");
    const decryptWasmPath = path.join(decryptBuildDir, "elGamalTallyDecrypt_N8_js/elGamalTallyDecrypt_N8.wasm");
    const decryptZkeyPath = path.join(decryptSetupDir, "elGamalTallyDecrypt_N8_final.zkey");
    const decryptVkeyPath = path.join(decryptSetupDir, "verification_key.json");

    if (!fs.existsSync(decryptZkeyPath)) {
        console.error(`${RED}Error: Decrypt key files not found. Run 'bun run setup' first.${RESET}`);
        process.exit(1);
    }

    const decryptVkey = JSON.parse(fs.readFileSync(decryptVkeyPath, "utf8"));

    function toCircuitPoint(point) {
        return [F.toObject(point[0]).toString(), F.toObject(point[1]).toString()];
    }

    const aggC1 = aggregatedCiphertexts.map(ct => toCircuitPoint(ct.c1));
    const aggC2 = aggregatedCiphertexts.map(ct => toCircuitPoint(ct.c2));

    const decryptInput = {
        pk: toCircuitPoint(pubKey),
        aggC1: aggC1,
        aggC2: aggC2,
        tally: finalCounts.map(t => t.toString()),
        sk: privKey.toString()
    };

    console.log("Generating decryption proof...");
    const { proof: decryptProof, publicSignals: decryptSignals } = await snarkjs.groth16.fullProve(
        decryptInput,
        decryptWasmPath,
        decryptZkeyPath
    );
    console.log(`${GREEN}Decryption proof generated${RESET}`);

    const decryptVerified = await snarkjs.groth16.verify(decryptVkey, decryptSignals, decryptProof);
    if (decryptVerified) {
        console.log(`${GREEN}Decryption proof verified - Tally is cryptographically correct!${RESET}`);
    } else {
        console.error(`${RED}Decryption proof verification failed!${RESET}`);
        process.exit(1);
    }

    console.log(`\n${GREEN}PASSED: Integration test complete - Full voting flow verified!${RESET}`);
}

integrationTest().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
