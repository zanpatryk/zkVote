import { describe, it, expect } from "bun:test";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://pub-2326b479a93d4dabb5dbfe9392d21e89.r2.dev";

describe("Infrastructure: R2 Artifacts Verification", () => {
    
    const checkFile = async (path) => {
        const url = `${CDN_URL}${path}`;
        const response = await fetch(url, { method: "HEAD" });
        return {
            status: response.status,
            ok: response.ok,
            type: response.headers.get("content-type"),
            size: response.headers.get("content-length")
        };
    };

    describe("ElGamal Vote Circuit (N16)", () => {
        it("should have valid .wasm file", async () => {
            const result = await checkFile("/circuits/elgamalVoteVector_N16/elGamalVoteVector_N16.wasm");
            expect(result.ok).toBe(true);
            expect(result.status).toBe(200);
        });

        it("should have valid .zkey file", async () => {
            const result = await checkFile("/circuits/elgamalVoteVector_N16/elGamalVoteVector_N16_final.zkey");
            expect(result.ok).toBe(true);
            expect(result.size).toBeDefined();
            // .zkey files are large, should be > 50MB for N16
            expect(parseInt(result.size || "0")).toBeGreaterThan(50 * 1024 * 1024);
        });
    });

    describe("ElGamal Tally Circuit (N16)", () => {
        it("should have valid .wasm file", async () => {
            const result = await checkFile("/circuits/elGamalTallyDecrypt_N16/elGamalTallyDecrypt_N16.wasm");
            expect(result.ok).toBe(true);
        });

        it("should have valid .zkey file", async () => {
            const result = await checkFile("/circuits/elGamalTallyDecrypt_N16/elGamalTallyDecrypt_N16_final.zkey");
            expect(result.ok).toBe(true);
        });
    });

    describe("Semaphore Circuits", () => {
        it("should have tree depth 20 artifacts", async () => {
            const result = await checkFile("/semaphore/20/semaphore.wasm");
            expect(result.ok).toBe(true);
            
            const zkey = await checkFile("/semaphore/20/semaphore.zkey");
            expect(zkey.ok).toBe(true);
        });
    });
});
