/**
 * ZK Proof Generation Benchmark
 * Measures time and file sizes for proof generation
 */
import { generateProof } from '../src/proof.js';
import { init as initElgamal, generateKeyPair, randomScalar, encrypt } from '../src/elgamal.js';
import { init as initPedersen, randomBlinder, commit } from '../src/pedersen.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CIRCUITS_DIR = path.resolve(__dirname, '../artifacts');

const SAMPLE_SIZE = 3;

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileSizes(wasmPath, zkeyPath) {
    const wasmSize = fs.existsSync(wasmPath) ? fs.statSync(wasmPath).size : 0;
    const zkeySize = fs.existsSync(zkeyPath) ? fs.statSync(zkeyPath).size : 0;
    return { wasmSize, zkeySize, totalSize: wasmSize + zkeySize };
}

function getArtifactPaths(circuitName) {
    const artifactDir = path.join(CIRCUITS_DIR, circuitName);
    const wasmPath = path.join(artifactDir, `${circuitName}_js/${circuitName}.wasm`);
    const zkeyPath = path.join(artifactDir, `setup/${circuitName}_final.zkey`);
    return { artifactDir, wasmPath, zkeyPath };
}

// -- ElGamal Vote Scalar (single option index) --
async function benchmarkElGamalScalar(N = 8) {
    const circuitName = `elGamalVoteScalar_N${N}`;
    const { wasmPath, zkeyPath } = getArtifactPaths(circuitName);
    
    if (!fs.existsSync(wasmPath)) return { error: `Not found: ${circuitName}` };
    
    const sizes = getFileSizes(wasmPath, zkeyPath);
    await initElgamal();
    const { pk } = generateKeyPair();
    
    const times = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const input = {
            pk: [pk[0].toString(), pk[1].toString()],
            r: randomScalar().toString(),
            selectedOption: (i % N).toString()
        };
        const start = performance.now();
        await generateProof(input, wasmPath, zkeyPath);
        times.push(performance.now() - start);
    }
    
    return { circuit: circuitName, avgMs: times.reduce((a, b) => a + b) / times.length, ...sizes };
}

// -- ElGamal Vote Vector (one-hot vector of N ciphertexts) --
async function benchmarkElGamalVector(N = 8) {
    const circuitName = `elGamalVoteVector_N${N}`;
    const { wasmPath, zkeyPath } = getArtifactPaths(circuitName);
    
    if (!fs.existsSync(wasmPath)) return { error: `Not found: ${circuitName}` };
    
    const sizes = getFileSizes(wasmPath, zkeyPath);
    await initElgamal();
    const { pk } = generateKeyPair();
    
    const times = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const selectedOpt = i % N;
        const vote = Array(N).fill(0);
        vote[selectedOpt] = 1;
        const r = vote.map(() => randomScalar());
        
        const input = {
            pk: [pk[0].toString(), pk[1].toString()],
            vote: vote.map(v => v.toString()),
            r: r.map(x => x.toString())
        };
        const start = performance.now();
        await generateProof(input, wasmPath, zkeyPath);
        times.push(performance.now() - start);
    }
    
    return { circuit: circuitName, avgMs: times.reduce((a, b) => a + b) / times.length, ...sizes };
}

// -- ElGamal Tally Decrypt (decrypt N aggregated ciphertexts) --
async function benchmarkElGamalTallyDecrypt(N = 8) {
    const circuitName = `elGamalTallyDecrypt_N${N}`;
    const { wasmPath, zkeyPath } = getArtifactPaths(circuitName);
    
    if (!fs.existsSync(wasmPath)) return { error: `Not found: ${circuitName}` };
    
    const sizes = getFileSizes(wasmPath, zkeyPath);
    await initElgamal();
    const { sk, pk } = generateKeyPair();
    
    const times = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        // Simulate aggregated ciphertexts for each option
        const aggC1 = [];
        const aggC2 = [];
        const tally = [];
        
        for (let opt = 0; opt < N; opt++) {
            const tallyVal = (opt + i) % 100; // Simulated tally
            tally.push(tallyVal);
            const r = randomScalar();
            const ct = encrypt(pk, tallyVal, r);
            aggC1.push([ct.c1[0].toString(), ct.c1[1].toString()]);
            aggC2.push([ct.c2[0].toString(), ct.c2[1].toString()]);
        }
        
        const input = {
            pk: [pk[0].toString(), pk[1].toString()],
            aggC1,
            aggC2,
            tally: tally.map(t => t.toString()),
            sk: sk.toString()
        };
        const start = performance.now();
        await generateProof(input, wasmPath, zkeyPath);
        times.push(performance.now() - start);
    }
    
    return { circuit: circuitName, avgMs: times.reduce((a, b) => a + b) / times.length, ...sizes };
}

// -- Pedersen Vote Vector --
async function benchmarkPedersenVector(N = 8) {
    const circuitName = `pedersenVoteVector_N${N}`;
    const { wasmPath, zkeyPath } = getArtifactPaths(circuitName);
    
    if (!fs.existsSync(wasmPath)) return { error: `Not found: ${circuitName}` };
    
    const sizes = getFileSizes(wasmPath, zkeyPath);
    await initPedersen();
    
    const times = [];
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const selectedOpt = i % N;
        const vote = Array(N).fill(0);
        vote[selectedOpt] = 1;
        
        const blinders = vote.map(() => randomBlinder());
        const commitments = vote.map((v, j) => commit(v, blinders[j]));
        
        const input = {
            vote: vote.map(v => v.toString()),
            blinder: blinders.map(b => b.toString()),
            commitments: commitments.map(c => [c[0].toString(), c[1].toString()])
        };
        const start = performance.now();
        await generateProof(input, wasmPath, zkeyPath);
        times.push(performance.now() - start);
    }
    
    return { circuit: circuitName, avgMs: times.reduce((a, b) => a + b) / times.length, ...sizes };
}

export async function runProofBenchmarks() {
    console.log("\n========================================");
    console.log("       Proof Generation Benchmarks");
    console.log("========================================");
    console.log(`(Average of ${SAMPLE_SIZE} proofs per circuit)\n`);
    
    const results = [];
    
    // ElGamal Scalar
    console.log("--- ElGamal Vote Scalar (voter) ---");
    for (const N of [8, 64]) {
        process.stdout.write(`  N=${N}... `);
        const r = await benchmarkElGamalScalar(N);
        if (r.error) { console.log(`SKIP`); }
        else { console.log(`${(r.avgMs/1000).toFixed(2)}s | wasm: ${formatBytes(r.wasmSize)}, zkey: ${formatBytes(r.zkeySize)}`); results.push(r); }
    }
    
    // ElGamal Vector
    console.log("\n--- ElGamal Vote Vector (voter) ---");
    for (const N of [8, 16]) {
        process.stdout.write(`  N=${N}... `);
        const r = await benchmarkElGamalVector(N);
        if (r.error) { console.log(`SKIP: ${r.error}`); }
        else { console.log(`${(r.avgMs/1000).toFixed(2)}s | wasm: ${formatBytes(r.wasmSize)}, zkey: ${formatBytes(r.zkeySize)}`); results.push(r); }
    }
    
    // ElGamal Tally Decrypt
    console.log("\n--- ElGamal Tally Decrypt (coordinator) ---");
    for (const N of [8, 16, 32, 64]) {
        process.stdout.write(`  N=${N}... `);
        const r = await benchmarkElGamalTallyDecrypt(N);
        if (r.error) { console.log(`SKIP: ${r.error}`); }
        else { console.log(`${(r.avgMs/1000).toFixed(2)}s | wasm: ${formatBytes(r.wasmSize)}, zkey: ${formatBytes(r.zkeySize)}`); results.push(r); }
    }
    
    // Pedersen Vector
    console.log("\n--- Pedersen Vote Vector (voter) ---");
    for (const N of [8, 16]) {
        process.stdout.write(`  N=${N}... `);
        const r = await benchmarkPedersenVector(N);
        if (r.error) { console.log(`SKIP: ${r.error}`); }
        else { console.log(`${(r.avgMs/1000).toFixed(2)}s | wasm: ${formatBytes(r.wasmSize)}, zkey: ${formatBytes(r.zkeySize)}`); results.push(r); }
    }
    
    return results;
}

if (process.argv[1]?.endsWith('proof.bench.js')) {
    runProofBenchmarks().catch(console.error);
}
