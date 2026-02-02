const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const circomlibjs = require("circomlibjs");
const fs = require("fs");

const expect = chai.expect;

const N = 8;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

describe("ElGamalTallyDecrypt Circuit", function () {
    this.timeout(120000);

    let babyjub;
    let F;
    let G;
    let wasmPath;
    let zkeyPath;
    let vkey;

    before(async function () {
        babyjub = await circomlibjs.buildBabyjub();
        F = babyjub.F;
        G = [
            F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
            F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
        ];

        const buildDir = path.join(__dirname, "../../build/elGamalTallyDecrypt_N8");
        const setupDir = path.join(buildDir, "setup");
        wasmPath = path.join(buildDir, "elGamalTallyDecrypt_N8_js/elGamalTallyDecrypt_N8.wasm");
        zkeyPath = path.join(setupDir, "elGamalTallyDecrypt_N8_final.zkey");
        const vkeyPath = path.join(setupDir, "verification_key.json");

        if (!fs.existsSync(zkeyPath)) {
            throw new Error(`zkey not found at ${zkeyPath}. Run 'bun run setup' first.`);
        }

        vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
    });

    function encrypt(pk, m, r) {
        const c1 = babyjub.mulPointEscalar(G, r);
        const rPK = babyjub.mulPointEscalar(pk, r);
        const mG = babyjub.mulPointEscalar(G, BigInt(m));
        const c2 = babyjub.addPoint(rPK, mG);
        return { c1, c2 };
    }

    function toCircuitPoint(point) {
        return [F.toObject(point[0]).toString(), F.toObject(point[1]).toString()];
    }

    async function testDecrypt(tallyArray) {
        // Generate keypair
        const sk = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
        const pk = babyjub.mulPointEscalar(G, sk);

        // Create aggregated ciphertexts (simulating votes)
        const aggC1 = [];
        const aggC2 = [];
        for (let i = 0; i < N; i++) {
            const count = tallyArray[i];
            // Simulate 'count' voters for this option
            let sumC1 = [F.zero, F.one];
            let sumC2 = [F.zero, F.one];
            for (let v = 0; v < count; v++) {
                const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
                const { c1, c2 } = encrypt(pk, 1, r);
                sumC1 = babyjub.addPoint(sumC1, c1);
                sumC2 = babyjub.addPoint(sumC2, c2);
            }
            aggC1.push(toCircuitPoint(sumC1));
            aggC2.push(toCircuitPoint(sumC2));
        }

        const input = {
            pk: toCircuitPoint(pk),
            aggC1: aggC1,
            aggC2: aggC2,
            tally: tallyArray.map(t => t.toString()),
            sk: sk.toString()
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        return verified;
    }

    it("should verify correct tally [1, 0, 0, 0, 0, 0, 0, 0]", async function () {
        const verified = await testDecrypt([1, 0, 0, 0, 0, 0, 0, 0]);
        expect(verified).to.be.true;
    });

    it("should verify correct tally [1, 1, 3, 0, 0, 0, 0, 0]", async function () {
        const verified = await testDecrypt([1, 1, 3, 0, 0, 0, 0, 0]);
        expect(verified).to.be.true;
    });

    it("should verify correct tally [0, 0, 0, 0, 0, 0, 0, 5]", async function () {
        const verified = await testDecrypt([0, 0, 0, 0, 0, 0, 0, 5]);
        expect(verified).to.be.true;
    });

    it("should reject incorrect tally", async function () {
        // Generate keypair
        const sk = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
        const pk = babyjub.mulPointEscalar(G, sk);

        // Create ciphertexts for tally [1, 0, 0, 0, 0, 0, 0, 0]
        const aggC1 = [];
        const aggC2 = [];
        const realTally = [1, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < N; i++) {
            let sumC1 = [F.zero, F.one];
            let sumC2 = [F.zero, F.one];
            for (let v = 0; v < realTally[i]; v++) {
                const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
                const { c1, c2 } = encrypt(pk, 1, r);
                sumC1 = babyjub.addPoint(sumC1, c1);
                sumC2 = babyjub.addPoint(sumC2, c2);
            }
            aggC1.push(toCircuitPoint(sumC1));
            aggC2.push(toCircuitPoint(sumC2));
        }

        // Claim wrong tally
        const wrongTally = [2, 0, 0, 0, 0, 0, 0, 0];
        const input = {
            pk: toCircuitPoint(pk),
            aggC1: aggC1,
            aggC2: aggC2,
            tally: wrongTally.map(t => t.toString()),
            sk: sk.toString()
        };

        const originalError = console.error;
        console.error = () => {};
        try {
            await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
            expect.fail("Should have thrown error");
        } catch (e) {
            expect(e.message).to.include("Assert Failed");
        } finally {
            console.error = originalError;
        }
    });
});
