/**
 * Pedersen commitment utilities for ZK voting
 * Uses BabyJubJub curve
 */

import { buildBabyjub } from "circomlibjs";

let babyJub = null;
let F = null;

// Generator G (Base8)
const Gx = 5299619240641551281634865583518297030282874472190772894086521144482721001553n;
const Gy = 16950150798460657717958625567821834550301663161624707787222815936182638968203n;

// Generator H from pedersenVote.circom
// Must match exactly for circuit compatibility
let Hx = 17777552123799933955779906779655732241715742912184938656739573121738514868268n;
let Hy = 2626589144620713026669568689430873010625803728049924121243784502389097019475n;

/**
 * Initialize curve library (call once before using other functions)
 */
export async function init() {
    if (babyJub) return;
    babyJub = await buildBabyjub();
    F = babyJub.F;

    // Verify hardcoded H is on curve
    const H = [F.e(Hx), F.e(Hy)];
    if (!babyJub.inCurve(H)) {
        throw new Error("Hardcoded H point is not on BabyJubJub curve!");
    }
}

/**
 * Generate a random blinder
 * @returns {bigint}
 */
export function randomBlinder() {
    return BigInt("0x" + [...crypto.getRandomValues(new Uint8Array(31))]
        .map(b => b.toString(16).padStart(2, "0")).join(""));
}

/**
 * Compute Pedersen commitment: C = vote * G + blinder * H
 * @param {number} vote - Vote value (0 or 1)
 * @param {bigint} blinder - Random blinder
 * @returns {[bigint, bigint]} - Commitment point
 */
export function commit(vote, blinder) {
    if (!babyJub) throw new Error("Call init() first");
    
    const G = [F.e(Gx), F.e(Gy)];
    const H = [F.e(Hx), F.e(Hy)];
    
    // C = vote * G + blinder * H
    const voteG = babyJub.mulPointEscalar(G, BigInt(vote));
    const blinderH = babyJub.mulPointEscalar(H, blinder);
    const C = babyJub.addPoint(voteG, blinderH);
    
    return [F.toObject(C[0]), F.toObject(C[1])];
}

/**
 * Aggregate multiple commitments (homomorphic addition)
 * @param {Array<[bigint, bigint]>} commitments
 * @returns {[bigint, bigint]}
 */
export function aggregateCommitments(commitments) {
    if (!babyJub) throw new Error("Call init() first");
    if (commitments.length === 0) throw new Error("No commitments to aggregate");
    
    let agg = [F.e(commitments[0][0]), F.e(commitments[0][1])];
    
    for (let i = 1; i < commitments.length; i++) {
        const c = [F.e(commitments[i][0]), F.e(commitments[i][1])];
        agg = babyJub.addPoint(agg, c);
    }
    
    return [F.toObject(agg[0]), F.toObject(agg[1])];
}

/**
 * Verify tally by unblinding: check if aggC == tally*G + sumBlinders*H
 * @param {[bigint, bigint]} aggCommitment - Aggregated commitment
 * @param {number} tally - Claimed tally
 * @param {bigint} sumBlinders - Sum of all blinders
 * @returns {boolean}
 */
export function verifyTally(aggCommitment, tally, sumBlinders) {
    if (!babyJub) throw new Error("Call init() first");
    
    const G = [F.e(Gx), F.e(Gy)];
    const H = [F.e(Hx), F.e(Hy)];
    
    // Expected = tally * G + sumBlinders * H
    const tallyG = babyJub.mulPointEscalar(G, BigInt(tally));
    const blindersH = babyJub.mulPointEscalar(H, sumBlinders);
    const expected = babyJub.addPoint(tallyG, blindersH);
    
    const agg = [F.e(aggCommitment[0]), F.e(aggCommitment[1])];
    
    return F.eq(agg[0], expected[0]) && F.eq(agg[1], expected[1]);
}

export { babyJub, F, Gx, Gy, Hx, Hy };
