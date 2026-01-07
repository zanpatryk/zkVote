import { describe, it, expect } from "bun:test";
import * as lib from "../src/index.js";
import { generateKeyPair } from "../src/elgamal.js";

describe("Public API", () => {
    it("should export elgamal utilities", () => {
        expect(lib.elgamal).toBeDefined();
        // Named exports
        expect(lib.generateKeyPair).toBeDefined();
        expect(lib.encrypt).toBeDefined();
        expect(lib.decryptScalar).toBeDefined();
        // Namespace export
        expect(lib.elgamal.init).toBeDefined();
    });

    it("should export pedersen utilities", () => {
        expect(lib.pedersen).toBeDefined();
        expect(lib.pedersen.commit).toBeDefined();
        expect(lib.pedersen.verifyTally).toBeDefined();
    });

    it("should export proof utilities", () => {
        expect(lib.proof).toBeDefined();
        expect(lib.proof.generateProof).toBeDefined();
        expect(lib.proof.verifyProof).toBeDefined();
        expect(lib.proof.formatProofForSolidity).toBeDefined();
    });
});
