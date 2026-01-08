/**
 * Benchmark Runner
 */
import { runElGamalBenchmarks } from './elgamal.bench.js';
import { runPedersenBenchmarks } from './pedersen.bench.js';
import { runProofBenchmarks } from './proof.bench.js';

async function main() {
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║            zkvote-lib Off-Chain Benchmarks                     ║");
    console.log("║         Measuring cryptographic operations at scale            ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    
    const startTotal = performance.now();
    
    const elgamalResults = await runElGamalBenchmarks();
    const pedersenResults = await runPedersenBenchmarks();
    const proofResults = await runProofBenchmarks();
    
    // Summary
    console.log("\n\n========================================");
    console.log("              SUMMARY");
    console.log("========================================\n");
    
    console.log("VOTER EXPERIENCE:");
    console.log(`  ElGamal Encryption:    ${elgamalResults.singleEncTime.toFixed(0)} ms`);
    console.log(`  Pedersen Commitment:   ${pedersenResults.singleCommitTime.toFixed(0)} ms`);
    
    // Proof generation summary
    if (proofResults.length > 0) {
        console.log("\nPROOF GENERATION (time | wasm + zkey size):");
        for (const r of proofResults) {
            const sizeMB = ((r.wasmSize + r.zkeySize) / (1024 * 1024)).toFixed(1);
            console.log(`  ${r.circuit.padEnd(25)}: ${(r.avgMs / 1000).toFixed(2)}s | ${sizeMB} MB`);
        }
    }
    
    console.log("\nTALLY COORDINATOR (1M votes):");
    const vector1M = elgamalResults.vectorResults.find(r => r.voters === 1_000_000);
    const pedAgg1M = pedersenResults.aggResults.find(r => r.votes === 1_000_000);
    
    if (vector1M) {
        console.log(`  [Vector] Aggregation:  ${(vector1M.aggTime / 1000).toFixed(1)} sec`);
        console.log(`  [Vector] Decryption:   ${vector1M.decTime.toFixed(0)} ms (8 options)`);
    }
    if (pedAgg1M) {
        console.log(`  Pedersen Aggregation:  ${(pedAgg1M.ms / 1000).toFixed(1)} sec`);
    }
    
    if (elgamalResults.scalarPerVote) {
        const perVoteMs = elgamalResults.scalarPerVote;
        console.log(`  [Scalar] Per-vote:     ${perVoteMs.toFixed(1)} ms`);
        console.log(`  [Scalar] 1M decrypts:  ~${(perVoteMs * 1_000_000 / 1000 / 60).toFixed(0)} min`);
    }
    
    const totalTime = ((performance.now() - startTotal) / 1000).toFixed(1);
    console.log(`\nTotal benchmark time: ${totalTime}s`);
}

main().catch(console.error);

