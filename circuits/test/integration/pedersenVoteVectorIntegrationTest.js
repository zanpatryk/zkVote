const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const N_OPTIONS = 8;
const N_VOTERS = 5;

const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

async function integrationTest() {
    console.log("=== Homomorphic Vote Tallying Integration Test ===\n");
    console.log(`Options: ${N_OPTIONS}, Voters: ${N_VOTERS}\n`);

    const circomlibjs = require("circomlibjs");
    const babyjub = await circomlibjs.buildBabyjub();
    const F = babyjub.F;
    const G = [
        F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
        F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
    ];
    const H = [
        F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
        F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475")
    ];

    const voters = [];
    const buildDir = path.join(__dirname, "../../build/pedersenVoteVector_N8");
    const setupDir = path.join(buildDir, "setup");
    const wasmPath = path.join(buildDir, "pedersenVoteVector_N8_js/pedersenVoteVector_N8.wasm");
    const zkeyPath = path.join(setupDir, "pedersenVoteVector_N8_final.zkey");
    const vkeyPath = path.join(setupDir, "verification_key.json");

    if (!fs.existsSync(zkeyPath)) {
        console.error(`${RED}Run setup first: node circuits/scripts/setup.js${RESET}`);
        process.exit(1);
    }

    const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));

    function computeCommitment(vote, blinder) {
        const voteG = babyjub.mulPointEscalar(G, vote);
        const blinderH = babyjub.mulPointEscalar(H, blinder);
        const result = babyjub.addPoint(voteG, blinderH);
        return [F.toObject(result[0]), F.toObject(result[1])];
    }

    console.log("=== Phase 1: Voters Cast Encrypted Votes ===\n");

    const voterChoices = [0, 2, 2, 1, 2];

    for (let v = 0; v < N_VOTERS; v++) {
        const vote = new Array(N_OPTIONS).fill(0n);
        vote[voterChoices[v]] = 1n;

        const blinder = [];
        for (let i = 0; i < N_OPTIONS; i++) {
            blinder[i] = BigInt(Math.floor(Math.random() * 2 ** 200)) % SUBORDER;
        }

        const commitments = [];
        for (let i = 0; i < N_OPTIONS; i++) {
            commitments.push(computeCommitment(vote[i], blinder[i]));
        }

        const input = {
            vote: vote.map(x => x.toString()),
            blinder: blinder.map(x => x.toString()),
            commitments: commitments.map(c => c.map(x => x.toString()))
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        if (!verified) {
            console.error(`${RED}Voter ${v} proof failed!${RESET}`);
            process.exit(1);
        }

        voters.push({ vote, blinder, commitments, proof });
        console.log(`Voter ${v}: voted for option ${voterChoices[v]} ${GREEN}OK${RESET}`);
    }

    console.log("\n=== Phase 2: Homomorphic Aggregation ===\n");

    let aggregatedCommitments = [];
    for (let i = 0; i < N_OPTIONS; i++) {
        let agg = [F.zero, F.one];
        for (let v = 0; v < N_VOTERS; v++) {
            const point = [F.e(voters[v].commitments[i][0]), F.e(voters[v].commitments[i][1])];
            agg = babyjub.addPoint(agg, point);
        }
        aggregatedCommitments.push(agg);
    }
    console.log("Aggregated commitments computed (point addition)");

    console.log("\n=== Phase 3: Blinder Reveal ===\n");

    const totalBlinders = new Array(N_OPTIONS).fill(0n);
    for (let v = 0; v < N_VOTERS; v++) {
        for (let i = 0; i < N_OPTIONS; i++) {
            totalBlinders[i] = (totalBlinders[i] + voters[v].blinder[i]) % SUBORDER;
        }
    }

    const expectedTally = new Array(N_OPTIONS).fill(0);
    for (let v = 0; v < N_VOTERS; v++) {
        for (let i = 0; i < N_OPTIONS; i++) {
            expectedTally[i] += Number(voters[v].vote[i]);
        }
    }

    console.log("All blinders revealed");
    console.log("Expected tally:", expectedTally);

    console.log("\n=== Phase 4: Unblinding & Tally Verification ===\n");

    let computedTally = [];
    let allMatch = true;

    for (let i = 0; i < N_OPTIONS; i++) {
        const totalBlindMod = totalBlinders[i] % SUBORDER;
        const blinderH = babyjub.mulPointEscalar(H, totalBlindMod);

        const negBlindH = [F.neg(blinderH[0]), blinderH[1]];

        const unblinded = babyjub.addPoint(aggregatedCommitments[i], negBlindH);

        let foundTally = -1;
        for (let t = 0; t <= N_VOTERS; t++) {
            const expectedPoint = babyjub.mulPointEscalar(G, BigInt(t));
            if (F.eq(unblinded[0], expectedPoint[0]) && F.eq(unblinded[1], expectedPoint[1])) {
                foundTally = t;
                break;
            }
        }

        computedTally.push(foundTally);

        if (foundTally === expectedTally[i]) {
            console.log(`Option ${i}: ${foundTally} votes ${GREEN}(unblinded & verified)${RESET}`);
        } else {
            console.log(`Option ${i}: ${RED}Mismatch (computed=${foundTally}, expected=${expectedTally[i]})${RESET}`);
            allMatch = false;
        }
    }

    console.log("\n=== Final Results ===\n");
    console.log("Vote Distribution:");
    for (let i = 0; i < N_OPTIONS; i++) {
        console.log(`  Option ${i}: ${computedTally[i]} votes`);
    }

    const maxVotes = Math.max(...computedTally);
    const winners = computedTally.map((v, i) => v === maxVotes ? i : -1).filter(x => x >= 0);
    console.log(`\nWinner: Option ${winners.join(", ")} with ${maxVotes} votes`);

    if (allMatch) {
        console.log(`\n${GREEN}PASSED: Integration test complete - Homomorphic unblinding verified!${RESET}`);
    } else {
        console.log(`\n${RED}FAILED: Integration test${RESET}`);
        process.exit(1);
    }

    process.exit(0);
}

integrationTest().catch(err => {
    console.error("Error:", err.message);
    process.exit(1);
});
