const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const circomlibjs = require("circomlibjs");
const fs = require("fs");

const expect = chai.expect;

const MAX_OPTIONS = 8;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

describe("ElGamalVoteScalar Circuit", function () {
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

        const buildDir = path.join(__dirname, "../../build/elGamalVoteScalar_N8");
        const setupDir = path.join(buildDir, "setup");
        wasmPath = path.join(buildDir, "elGamalVoteScalar_N8_js/elGamalVoteScalar_N8.wasm");
        zkeyPath = path.join(setupDir, "elGamalVoteScalar_N8_final.zkey");
        const vkeyPath = path.join(setupDir, "verification_key.json");

        if (!fs.existsSync(zkeyPath)) {
            throw new Error(`zkey not found at ${zkeyPath}. Run 'bun run setup' first.`);
        }

        vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
    });

    function toCircuitPoint(point) {
        return [F.toObject(point[0]).toString(), F.toObject(point[1]).toString()];
    }

    async function testVote(selectedOption) {
        // Generate keypair
        const sk = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
        const pk = babyjub.mulPointEscalar(G, sk);

        // Randomness
        const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;

        const input = {
            pk: toCircuitPoint(pk),
            selectedOption: selectedOption.toString(),
            r: r.toString()
        };

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        // Public signals: [c1_x, c1_y, c2_x, c2_y]
        // No optionHash anymore
        
        return verified;
    }

    describe("Valid Votes", function () {
        it("should accept vote for option 0", async function () {
            const verified = await testVote(0);
            expect(verified).to.be.true;
        });

        it("should accept vote for option 3", async function () {
            const verified = await testVote(3);
            expect(verified).to.be.true;
        });

        it("should accept vote for option 7", async function () {
            const verified = await testVote(7);
            expect(verified).to.be.true;
        });
    });

    describe("Invalid Votes", function () {
        it("should reject option out of range (8)", async function () {
            const sk = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
            const pk = babyjub.mulPointEscalar(G, sk);
            const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;

            const input = {
                pk: toCircuitPoint(pk),
                selectedOption: "8", // Out of range for N=8
                r: r.toString()
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

    describe("Encryption Correctness", function () {
        it("should produce correct ElGamal ciphertext", async function () {
            const sk = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
            const pk = babyjub.mulPointEscalar(G, sk);
            const r = BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER;
            const selectedOption = 5n;

            const input = {
                pk: toCircuitPoint(pk),
                selectedOption: selectedOption.toString(),
                r: r.toString()
            };

            const { publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

            // Extract C1, C2 from public signals (no optionHash now)
            const c1 = [publicSignals[0], publicSignals[1]];
            const c2 = [publicSignals[2], publicSignals[3]];

            // Calculate expected: C1 = r*G, C2 = r*PK + selectedOption*G
            const expectedC1 = babyjub.mulPointEscalar(G, r);
            const rPK = babyjub.mulPointEscalar(pk, r);
            const mG = babyjub.mulPointEscalar(G, selectedOption);
            const expectedC2 = babyjub.addPoint(rPK, mG);

            expect(c1[0]).to.equal(F.toObject(expectedC1[0]).toString());
            expect(c1[1]).to.equal(F.toObject(expectedC1[1]).toString());
            expect(c2[0]).to.equal(F.toObject(expectedC2[0]).toString());
            expect(c2[1]).to.equal(F.toObject(expectedC2[1]).toString());
        });
    });
});
