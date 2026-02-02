/**
 * ElGamal Benchmark - Real-world voting scenarios
 * 
 * Scenario A (Vector): Aggregate N ciphertexts, decrypt 8 options
 * Scenario B (Scalar): Decrypt each vote individually (sampled)
 */
import * as elgamal from '../src/elgamal.js';

const VOTER_COUNTS = [1_000, 10_000, 100_000, 1_000_000];
const NUM_OPTIONS = 8;
const MAX_OPTION_INDEX = 63;
const SCALAR_SAMPLE_SIZE = 100; // Sample for per-vote timing

async function benchmarkSingleEncryption() {
    const { pk } = elgamal.generateKeyPair();
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
        elgamal.encrypt(pk, i % 8, elgamal.randomScalar());
    }
    return (performance.now() - start) / 10;
}

async function benchmarkVectorScenario(numVoters, numOptions) {
    const { sk, pk } = elgamal.generateKeyPair();
    
    // Aggregation
    const baseCt = elgamal.encrypt(pk, 1, elgamal.randomScalar());
    const aggStart = performance.now();
    let agg = baseCt;
    for (let i = 1; i < numVoters; i++) {
        agg = elgamal.addCiphertexts(agg, baseCt);
    }
    const aggTime = performance.now() - aggStart;
    
    // Decrypt all options
    const ciphertexts = [];
    for (let opt = 0; opt < numOptions; opt++) {
        const tally = Math.floor(numVoters / numOptions);
        ciphertexts.push(elgamal.encrypt(pk, tally, elgamal.randomScalar()));
    }
    
    const decStart = performance.now();
    for (const ct of ciphertexts) {
        elgamal.decryptScalar(sk, ct, numVoters);
    }
    const decTime = performance.now() - decStart;
    
    return { aggTime, decTime, totalTime: aggTime + decTime };
}

async function benchmarkScalarScenario() {
    const { sk, pk } = elgamal.generateKeyPair();
    const testCt = elgamal.encrypt(pk, 42, elgamal.randomScalar());
    
    // Sample only
    const start = performance.now();
    for (let i = 0; i < SCALAR_SAMPLE_SIZE; i++) {
        elgamal.decryptScalar(sk, testCt, MAX_OPTION_INDEX);
    }
    const elapsed = performance.now() - start;
    
    return elapsed / SCALAR_SAMPLE_SIZE;
}

export async function runElGamalBenchmarks() {
    console.log("\n========================================");
    console.log("       ElGamal Benchmark Results");
    console.log("========================================");
    
    await elgamal.init();
    
    // Single encryption
    console.log("\n--- SINGLE VOTER ENCRYPTION ---");
    const singleEncTime = await benchmarkSingleEncryption();
    console.log(`Time per encryption: ${singleEncTime.toFixed(2)} ms`);
    
    // Scenario A: Vector
    console.log("\n--- SCENARIO A: VECTOR ENCODING ---");
    console.log("(Aggregate votes, then decrypt 8 options)");
    const vectorResults = [];
    for (const numVoters of VOTER_COUNTS) {
        console.log(`  Processing ${numVoters.toLocaleString()} voters...`);
        const result = await benchmarkVectorScenario(numVoters, NUM_OPTIONS);
        console.log(`    Agg: ${(result.aggTime/1000).toFixed(1)}s, Dec: ${result.decTime.toFixed(0)}ms, Total: ${(result.totalTime/1000).toFixed(1)}s`);
        vectorResults.push({ voters: numVoters, ...result });
    }
    
    // Scenario B: Scalar (sampled)
    console.log("\n--- SCENARIO B: SCALAR ENCODING ---");
    console.log(`(Sample ${SCALAR_SAMPLE_SIZE} decrypts, maxMsg=${MAX_OPTION_INDEX})`);
    const perVoteMs = await benchmarkScalarScenario();
    console.log(`  Per-vote decrypt: ${perVoteMs.toFixed(2)} ms`);
    console.log(`  Estimated times:`);
    for (const n of VOTER_COUNTS) {
        const totalSec = (perVoteMs * n) / 1000;
        const display = totalSec < 60 ? `${totalSec.toFixed(1)}s` : `${(totalSec/60).toFixed(1)} min`;
        console.log(`    ${n.toLocaleString().padStart(10)} voters: ${display}`);
    }
    
    return { singleEncTime, vectorResults, scalarPerVote: perVoteMs };
}

if (process.argv[1]?.endsWith('elgamal.bench.js')) {
    runElGamalBenchmarks().catch(console.error);
}
