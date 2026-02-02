import { describe, it, expect, beforeAll } from "bun:test";
import { init, commit, aggregateCommitments, verifyTally, randomBlinder, babyJub, F, Gx, Gy, Hx, Hy } from "../src/pedersen.js";

describe("Pedersen Commitments", () => {
    beforeAll(async () => {
        await init();
    });

    it("should create valid commitments", () => {
        const blinder = randomBlinder();
        const commitment = commit(1, blinder);
        expect(commitment).toHaveLength(2);
        expect(typeof commitment[0]).toBe("bigint");
        expect(typeof commitment[1]).toBe("bigint");
    });

    it("should aggregate commitments homomorphically", () => {
        // Vote 1
        const r1 = randomBlinder();
        const c1 = commit(1, r1);
        
        // Vote 0
        const r2 = randomBlinder();
        const c2 = commit(0, r2);
        
        // Vote 1
        const r3 = randomBlinder();
        const c3 = commit(1, r3);

        const agg = aggregateCommitments([c1, c2, c3]);
        
        // Use modular addition for scalars to respect curve order
        const sumBlinders = (r1 + r2 + r3) % babyJub.subOrder;
        const expectedTally = 2; // 1 + 0 + 1

        const isValid = verifyTally(agg, expectedTally, sumBlinders);
        expect(isValid).toBe(true);
    });

    it("should fail validation with incorrect tally", () => {
        const r = randomBlinder();
        const c = commit(1, r);
        const isValid = verifyTally(c, 0, r); // Claiming 0 but voted 1
        expect(isValid).toBe(false);
    });

    it("should fail validation with incorrect blinder sum", () => {
        const r = randomBlinder();
        const c = commit(1, r);
        const isValid = verifyTally(c, 1, r + 1n); // Wrong blinder
        expect(isValid).toBe(false);
    });
});
