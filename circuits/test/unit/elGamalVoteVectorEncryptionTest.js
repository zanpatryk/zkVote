const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const circomlibjs = require("circomlibjs");
const fs = require("fs");

const expect = chai.expect;

const N = 8;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

describe("ElGamal Encryption (VoteVector)", function () {
    this.timeout(120000);

    let babyjub;
    let F;
    let G;
    let wasmPath;
    let zkeyPath;
    let vkey;
    
    // Keypair
    let privKey;
    let pubKey;

    before(async function () {
        babyjub = await circomlibjs.buildBabyjub();
        F = babyjub.F;
        
        // Use explicit coordinates for G (Base8) to match the circuit
        G = [
            F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
            F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
        ];

        const buildDir = path.join(__dirname, "../../build/elGamalVoteVector_N8");
        const setupDir = path.join(buildDir, "setup");
        wasmPath = path.join(buildDir, "elGamalVoteVector_N8_js/elGamalVoteVector_N8.wasm");
        zkeyPath = path.join(setupDir, "elGamalVoteVector_N8_final.zkey");
        const vkeyPath = path.join(setupDir, "verification_key.json");

        if (!fs.existsSync(zkeyPath)) {
            throw new Error(`zkey not found at ${zkeyPath}. Run 'bun run setup' first.`);
        }
        
        vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
    });

    function encryptElGamal(pk, m, r) {
        // C1 = r * G
        const c1Point = babyjub.mulPointEscalar(G, r);
        
        // C2 = r * PK + m * G
        const rPK = babyjub.mulPointEscalar(pk, r);
        const mG = babyjub.mulPointEscalar(G, BigInt(m));
        const c2Point = babyjub.addPoint(rPK, mG);
        
        return {
            c1: [F.toObject(c1Point[0]).toString(), F.toObject(c1Point[1]).toString()],
            c2: [F.toObject(c2Point[0]).toString(), F.toObject(c2Point[1]).toString()]
        };
    }

    async function testEncryption(mValue, optionIndex) {
        // Generate Keys
        const sk = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
        const pk = babyjub.mulPointEscalar(G, sk);
        const pkObj = [F.toObject(pk[0]).toString(), F.toObject(pk[1]).toString()];

        // Randomness
        const rValues = [];
        for (let i = 0; i < N; i++) {
            rValues.push(BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER);
        }

        // Vote vector (MUST be one-hot)
        const vote = new Array(N).fill("0");
        if (mValue === 1) {
            vote[optionIndex] = "1";
        } else {
            // If testing m=0 at optionIndex, we must set another index to 1
            const otherIndex = (optionIndex + 1) % N;
            vote[otherIndex] = "1";
        }

        const input = {
            pk: pkObj,
            vote: vote,
            r: rValues.map(rv => rv.toString())
        };

        const { publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

        // Extract ciphertexts from publicSignals
        // publicSignals: [C0_c1x, C0_c1y, C0_c2x, C0_c2y, C1_c1x, ..., pk0, pk1]
        const offset = optionIndex * 4;
        const circuitC1 = [publicSignals[offset], publicSignals[offset+1]];
        const circuitC2 = [publicSignals[offset+2], publicSignals[offset+3]];

        // Calculate expected for the tested optionIndex
        const actualM = BigInt(vote[optionIndex]);
        const expected = encryptElGamal(pk, actualM, rValues[optionIndex]);

        expect(circuitC1[0]).to.equal(expected.c1[0]);
        expect(circuitC1[1]).to.equal(expected.c1[1]);
        expect(circuitC2[0]).to.equal(expected.c2[0]);
        expect(circuitC2[1]).to.equal(expected.c2[1]);
    }

    it("should correctly encrypt message 1 for option 0", async function () {
        await testEncryption(1, 0);
    });

    it("should correctly encrypt message 0 for option 0 (by voting for option 1)", async function () {
        await testEncryption(0, 0);
    });

    it("should correctly encrypt message 1 for option 5", async function () {
        await testEncryption(1, 5);
    });

    it("should correctly encrypt message 0 for option 7 (by voting for option 0)", async function () {
        await testEncryption(0, 7);
    });
});
