const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const circomlibjs = require("circomlibjs");
const fs = require("fs");

const expect = chai.expect;

const N = 8;
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

describe("ElGamalVoteVector Circuit", function () {
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
        G = babyjub.Base8;

        const buildDir = path.join(__dirname, "../../build/elGamalVoteVector_N8");
        const setupDir = path.join(buildDir, "setup");
        wasmPath = path.join(buildDir, "elGamalVoteVector_N8_js/elGamalVoteVector_N8.wasm");
        zkeyPath = path.join(setupDir, "elGamalVoteVector_N8_final.zkey");
        const vkeyPath = path.join(setupDir, "verification_key.json");

        if (!fs.existsSync(zkeyPath)) {
            throw new Error(`zkey not found at ${zkeyPath}. Run 'bun run setup:elgamal' first.`);
        }
        
        vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
        
        // Generate Owner Keypair
        // Private Key: Random scalar
        do {
            privKey = BigInt(Math.floor(Math.random() * 1000000000));
        } while (privKey >= SUBORDER);
        
        // Public Key: sk * G
        pubKey = babyjub.mulPointEscalar(G, privKey);
    });

    function generateInputs(voteVector) {
        // Randomness for encryption
        const r = [];
        for (let i = 0; i < N; i++) {
            r.push(BigInt(Math.floor(Math.random() * 1000000000)) % SUBORDER);
        }

        return {
            pk: [F.toObject(pubKey[0]), F.toObject(pubKey[1])],
            vote: voteVector,
            r: r
        };
    }

    async function generateAndVerifyProof(input) {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            wasmPath,
            zkeyPath
        );

        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        return verified;
    }

    describe("Valid Votes", function () {
        it("should accept valid vote for option 0", async function () {
            const input = generateInputs([1, 0, 0, 0, 0, 0, 0, 0]);
            const verified = await generateAndVerifyProof(input);
            expect(verified).to.be.true;
        });
        
        it("should accept valid vote for option 7", async function () {
            const input = generateInputs([0, 0, 0, 0, 0, 0, 0, 1]);
            const verified = await generateAndVerifyProof(input);
            expect(verified).to.be.true;
        });
    });

    describe("Invalid Votes", function () {
        it("should reject multiple votes", async function () {
             const input = generateInputs([1, 1, 0, 0, 0, 0, 0, 0]);
             const originalError = console.error;
             console.error = () => {};
             try {
                await generateAndVerifyProof(input);
                expect.fail("Should have thrown error");
             } catch (e) {
                expect(e.message).to.include("Assert Failed");
             } finally {
                console.error = originalError;
             }
        });

        it("should reject values other than 0/1", async function () {
             const input = generateInputs([2, -1, 0, 0, 0, 0, 0, 0]);
             const originalError = console.error;
             console.error = () => {};
             try {
                await generateAndVerifyProof(input);
                expect.fail("Should have thrown error");
             } catch (e) {
                expect(e.message).to.include("Assert Failed");
             } finally {
                console.error = originalError;
             }
        });
    });
});
