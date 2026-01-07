/**
 * Pedersen Benchmark - Commitment and aggregation
 */
import * as pedersen from '../src/pedersen.js';

const VOTER_COUNTS = [1_000, 10_000, 100_000, 1_000_000];

async function benchmarkSingleCommitment() {
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
        pedersen.commit(i % 2, pedersen.randomBlinder());
    }
    return (performance.now() - start) / 10;
}

async function benchmarkAggregation(numVotes) {
    const baseCommit = pedersen.commit(1, pedersen.randomBlinder());
    const commitments = Array(numVotes).fill(baseCommit);
    
    const start = performance.now();
    pedersen.aggregateCommitments(commitments);
    return performance.now() - start;
}

export async function runPedersenBenchmarks() {
    console.log("\n========================================");
    console.log("       Pedersen Benchmark Results");
    console.log("========================================");
    
    await pedersen.init();
    
    console.log("\n--- SINGLE VOTER COMMITMENT ---");
    const singleCommitTime = await benchmarkSingleCommitment();
    console.log(`Time per commitment: ${singleCommitTime.toFixed(2)} ms`);
    
    console.log("\n--- COMMITMENT AGGREGATION ---");
    const aggResults = [];
    for (const numVotes of VOTER_COUNTS) {
        console.log(`  Processing ${numVotes.toLocaleString()} votes...`);
        const ms = await benchmarkAggregation(numVotes);
        console.log(`    ${(ms/1000).toFixed(1)}s`);
        aggResults.push({ votes: numVotes, ms });
    }
    
    return { singleCommitTime, aggResults };
}

if (process.argv[1]?.endsWith('pedersen.bench.js')) {
    runPedersenBenchmarks().catch(console.error);
}
