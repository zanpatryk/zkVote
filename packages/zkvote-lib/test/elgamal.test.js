import { describe, it, expect, beforeAll } from "bun:test";
import { init, generateKeyPair, encrypt, decryptScalar, randomScalar, addCiphertexts } from "../src/elgamal.js";

describe("EC ElGamal Encryption (BabyJubJub)", () => {
    beforeAll(async () => {
        await init();
    });

    it("should generate valid key pairs", () => {
        const { sk, pk } = generateKeyPair();
        expect(sk).toBeDefined();
        expect(pk).toBeDefined();
        expect(typeof sk).toBe("bigint");
        expect(Array.isArray(pk)).toBe(true); // Point [x, y]
        expect(pk.length).toBe(2);
    });

    it("should encrypt and decrypt option 0", () => {
        const { sk, pk } = generateKeyPair();
        const r = randomScalar();
        const option = 0;
        
        const ciphertext = encrypt(pk, option, r);
        // Pass a reasonable maxMsg, just checking 0 here
        const decrypted = decryptScalar(sk, ciphertext, 10);
        
        expect(decrypted).toBe(option);
    });

    it("should encrypt and decrypt option 7 (max for N=8)", () => {
        const { sk, pk } = generateKeyPair();
        const r = randomScalar();
        const option = 7;
        
        const ciphertext = encrypt(pk, option, r);
        const decrypted = decryptScalar(sk, ciphertext, 10);
        
        expect(decrypted).toBe(option);
    });

    it("should be homomorphic", () => {
        const { sk, pk } = generateKeyPair();
        
        // Encrypt 2
        const r1 = randomScalar();
        const c1 = encrypt(pk, 2, r1);
        
        // Encrypt 3
        const r2 = randomScalar();
        const c2 = encrypt(pk, 3, r2);
        
        // Add ciphertexts
        const cSum = addCiphertexts(c1, c2);
        
        // Decrypt sum
        const decryptedSum = decryptScalar(sk, cSum, 100);
        
        expect(decryptedSum).toBe(5); // 2 + 3 = 5
    });

    it("should decrypt larger values using BSGS", () => {
        const { sk, pk } = generateKeyPair();
        const r = randomScalar();
        const option = 123; // Needs multiple giant steps (sqrt(200) ~ 15)
        
        const ciphertext = encrypt(pk, option, r);
        const decrypted = decryptScalar(sk, ciphertext, 200);
        
        expect(decrypted).toBe(option);
    });

    it("should produce different ciphertexts with different randomness", () => {
        const { sk, pk } = generateKeyPair();
        const r1 = randomScalar();
        const r2 = randomScalar();
        const option = 3;
        
        // Ensure randomness is different
        // (Probabilistically certain)
        
        const c1 = encrypt(pk, option, r1);
        const c2 = encrypt(pk, option, r2);
        
        // Different c1 points (r*G)
        expect(c1.c1[0]).not.toBe(c2.c1[0]);
        
        // But both decrypt to the same message
        expect(decryptScalar(sk, c1, 10)).toBe(option);
        expect(decryptScalar(sk, c2, 10)).toBe(option);
    });
});
