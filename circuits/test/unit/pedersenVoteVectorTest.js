const snarkjs = require("snarkjs");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

const N = 8;

// BabyJubJub subgroup order
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

let wasmPath, zkeyPath, vkeyPath, vkey;
let babyjub, F;

// Generator points - must match circuit exactly
let G, H;

describe("PedersenVoteVector Circuit", function () {
    this.timeout(120000);

    before(async function () {
        const circomlibjs = require("circomlibjs");
        babyjub = await circomlibjs.buildBabyjub();
        F = babyjub.F;

        // Generator G: Use the exact same values as circuit
        G = [
            F.e("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
            F.e("16950150798460657717958625567821834550301663161624707787222815936182638968203")
        ];

        // Generator H: Use the exact same values as circuit
        H = [
            F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475")
        ];

        const buildDir = path.join(__dirname, "../../build/pedersenVoteVector_N8");
        const setupDir = path.join(buildDir, "setup");
        wasmPath = path.join(buildDir, "pedersenVoteVector_N8_js/pedersenVoteVector_N8.wasm");
        zkeyPath = path.join(setupDir, "pedersenVoteVector_N8_final.zkey");
        vkeyPath = path.join(setupDir, "verification_key.json");

        if (!fs.existsSync(zkeyPath)) {
            throw new Error("Run setup first: node scripts/setup.js");
        }

        vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
    });

    // Compute C = vote * G + blinder * H
    function computeCommitment(vote, blinder) {
        // vote * G
        const voteG = babyjub.mulPointEscalar(G, vote);

        // blinder * H
        const blinderH = babyjub.mulPointEscalar(H, blinder);

        // Add points
        const result = babyjub.addPoint(voteG, blinderH);

        return [F.toObject(result[0]).toString(), F.toObject(result[1]).toString()];
    }

    function generateInputs(voteArray) {
        const vote = voteArray.map(v => BigInt(v));
        const blinder = [];
        for (let i = 0; i < N; i++) {
            blinder[i] = BigInt(Math.floor(Math.random() * 2 ** 200)) % SUBORDER;
        }
        const commitments = [];
        for (let i = 0; i < N; i++) {
            commitments.push(computeCommitment(vote[i], blinder[i]));
        }
        return {
            vote: vote.map(v => v.toString()),
            blinder: blinder.map(b => b.toString()),
            commitments
        };
    }

    async function generateAndVerifyProof(input) {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        return await snarkjs.groth16.verify(vkey, publicSignals, proof);
    }

    async function expectRejection(input) {
        const originalError = console.error;
        console.error = () => {};
        try {
            await generateAndVerifyProof(input);
            console.error = originalError;
            return false;
        } catch (err) {
            console.error = originalError;
            return true;
        }
    }

    describe("Valid Votes", function () {
        it("should accept a valid vote for option 0", async function () {
            const input = generateInputs([1, 0, 0, 0, 0, 0, 0, 0]);
            const verified = await generateAndVerifyProof(input);
            expect(verified).to.be.true;
        });

        it("should accept a valid vote for option 3", async function () {
            const input = generateInputs([0, 0, 0, 1, 0, 0, 0, 0]);
            const verified = await generateAndVerifyProof(input);
            expect(verified).to.be.true;
        });

        it("should accept a valid vote for option 7", async function () {
            const input = generateInputs([0, 0, 0, 0, 0, 0, 0, 1]);
            const verified = await generateAndVerifyProof(input);
            expect(verified).to.be.true;
        });
    });

    describe("Invalid Votes - One-Hot Constraint", function () {
        it("should reject multiple votes (options 0 and 2)", async function () {
            const input = generateInputs([1, 0, 1, 0, 0, 0, 0, 0]);
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });

        it("should reject zero votes", async function () {
            const input = generateInputs([0, 0, 0, 0, 0, 0, 0, 0]);
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });

        it("should reject all votes = 1", async function () {
            const input = generateInputs([1, 1, 1, 1, 1, 1, 1, 1]);
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });
    });

    describe("Invalid Votes - Binary Constraint", function () {
        it("should reject vote value = 2", async function () {
            const input = generateInputs([0, 0, 0, 1, 0, 0, 0, 0]);
            input.vote[3] = "2";
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });

        it("should reject negative vote value", async function () {
            const input = generateInputs([0, 0, 0, 1, 0, 0, 0, 0]);
            input.vote[3] = "-1";
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });
    });

    describe("Invalid Votes - Commitment Mismatch", function () {
        it("should reject corrupted commitment", async function () {
            const input = generateInputs([0, 0, 0, 1, 0, 0, 0, 0]);
            input.commitments[3] = ["12345678901234567890", "98765432109876543210"];
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });

        it("should reject swapped commitments", async function () {
            const input = generateInputs([0, 0, 0, 1, 0, 0, 0, 0]);
            const temp = input.commitments[0];
            input.commitments[0] = input.commitments[3];
            input.commitments[3] = temp;
            const rejected = await expectRejection(input);
            expect(rejected).to.be.true;
        });
    });
});
