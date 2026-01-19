/**
 * EC ElGamal encryption utilities for ZK voting using BabyJubJub curve
 */

import { buildBabyjub } from "circomlibjs";

let babyJub = null;
let F = null;
let G = null; // Base8 generator

// Subgroup order for BabyJubJub
const SUBORDER = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;

/**
 * Initialize curve library (call once before using other functions)
 */
export async function init() {
    if (babyJub) return;
    babyJub = await buildBabyjub();
    F = babyJub.F;
    G = babyJub.Base8;
}

/**
 * Generate a random scalar within the subgroup order
 * @returns {bigint}
 */
export function randomScalar() {
    // 31 bytes to ensure it's less than standard field size, then mod SUBORDER
    const buf = crypto.getRandomValues(new Uint8Array(31));
    let r = BigInt("0x" + [...buf].map(b => b.toString(16).padStart(2, "0")).join(""));
    return r % SUBORDER;
}

/**
 * Generate a new keypair
 * @returns {{ sk: bigint, pk: [bigint, bigint] }}
 */
export function generateKeyPair() {
    if (!babyJub) throw new Error("Call init() first");
    
    const sk = randomScalar();
    const pkPoint = babyJub.mulPointEscalar(G, sk);
    const pk = [F.toObject(pkPoint[0]), F.toObject(pkPoint[1])];
    
    return { sk, pk };
}

/**
 * Derive public key from private key
 * @param {bigint} sk 
 * @returns {[bigint, bigint]}
 */
export function getPublicKey(sk) {
    if (!babyJub) throw new Error("Call init() first");
    const pkPoint = babyJub.mulPointEscalar(G, sk);
    return [F.toObject(pkPoint[0]), F.toObject(pkPoint[1])];
}

/**
 * Encrypt a message using EC ElGamal
 * @param {Array<bigint>} pk - Public key point [x, y]
 * @param {bigint|number} message - Message scalar (e.g. 0 or 1, or option index)
 * @param {bigint} r - Randomness (nonce)
 * @returns {{ c1: [bigint, bigint], c2: [bigint, bigint] }}
 */
export function encrypt(pk, message, r) {
    if (!babyJub) throw new Error("Call init() first");
    
    const pkPoint = [F.e(pk[0]), F.e(pk[1])];
    const m = BigInt(message);
    
    // C1 = r * G
    const c1Point = babyJub.mulPointEscalar(G, r);
    
    // C2 = r * PK + m * G
    const rPk = babyJub.mulPointEscalar(pkPoint, r);
    const mG = babyJub.mulPointEscalar(G, m);
    const c2Point = babyJub.addPoint(rPk, mG);
    
    return {
        c1: [F.toObject(c1Point[0]), F.toObject(c1Point[1])],
        c2: [F.toObject(c2Point[0]), F.toObject(c2Point[1])]
    };
}

/**
 * Decrypt a ciphertext to get the message (as a point M*G)
 * To get scalar m, one must solve discrete log (easy for small m)
 * @param {bigint} sk - Secret key
 * @param {{ c1: [bigint, bigint], c2: [bigint, bigint] }} ciphertext
 * @returns {[bigint, bigint]} - Decrypted point M*G
 */
export function decryptPoint(sk, ciphertext) {
    if (!babyJub) throw new Error("Call init() first");
    
    const c1 = [F.e(ciphertext.c1[0]), F.e(ciphertext.c1[1])];
    const c2 = [F.e(ciphertext.c2[0]), F.e(ciphertext.c2[1])];
    
    // S = sk * C1
    const s = babyJub.mulPointEscalar(c1, sk);
    
    // M = C2 - S = C2 + (-S)
    const negS = [F.neg(s[0]), s[1]]; // Twisted Edwards negation: (-x, y)
    const mPoint = babyJub.addPoint(c2, negS);
    
    return [F.toObject(mPoint[0]), F.toObject(mPoint[1])];
}

/**
 * Decrypt and solve discrete log for small messages
 * @param {bigint} sk
 * @param {Object} ciphertext
 * @param {number} maxMsg - Maximum expected numeric value of message (e.g. N_VOTERS)
 * @returns {number} - Decrypted scalar message, or -1 if not found
 */
export function decryptScalar(sk, ciphertext, maxMsg = 1000) {
    if (!babyJub) throw new Error("Call init() first");

    const mPoint = decryptPoint(sk, ciphertext);
    
    // Baby-Step Giant-Step (BSGS)
    // m = i * m_ceil + j
    // m * G = (i * m_ceil + j) * G = i * (m_ceil * G) + j * G
    // mPoint - i * (m_ceil * G) = j * G
    
    // Safety check just in case maxMsg is unreasonably small
    if (maxMsg < 0) return -1;
    if (maxMsg === 0) {
        // Check 0
        const zeroPoint = babyJub.mulPointEscalar(G, 0n);
        if (F.eq(F.e(mPoint[0]), zeroPoint[0]) && F.eq(F.e(mPoint[1]), zeroPoint[1])) return 0;
        return -1;
    }

    const mCeil = Math.ceil(Math.sqrt(maxMsg + 1));
    const babySteps = new Map();

    // 1. Baby Steps: Store j*G for 0 <= j < mCeil
    let currentG = babyJub.mulPointEscalar(G, 0n); // 0*G = Identity
    for (let j = 0; j < mCeil; j++) {
        // Key: x,y string
        const key = F.toObject(currentG[0]).toString() + "," + F.toObject(currentG[1]).toString();
        babySteps.set(key, j);
        
        // Next j*G = currentG + G
        currentG = babyJub.addPoint(currentG, [F.e(G[0]), F.e(G[1])]);
    }

    // 2. Giant Steps: Check mPoint - i*(mCeil*G) for 0 <= i <= mCeil
    const giantStride = babyJub.mulPointEscalar(G, BigInt(mCeil));
    const negGiantStride = [F.neg(giantStride[0]), giantStride[1]]; // - (mCeil*G)

    // Current target = mPoint - 0*(mCeil*G) = mPoint
    let currentTarget = [F.e(mPoint[0]), F.e(mPoint[1])];

    for (let i = 0; i <= mCeil + 1; i++) { // Slight over-shoot to cover full range
        const key = F.toObject(currentTarget[0]).toString() + "," + F.toObject(currentTarget[1]).toString();
        
        if (babySteps.has(key)) {
            const j = babySteps.get(key);
            const m = i * mCeil + j;
            if (m <= maxMsg) return m;
        }

        // Prepare next target: Current - (mCeil*G) = Current + negGiantStride
        currentTarget = babyJub.addPoint(currentTarget, negGiantStride);
    }

    return -1;
}

/**
 * Homomorphically add two ciphertexts
 */
export function addCiphertexts(ct1, ct2) {
    if (!babyJub) throw new Error("Call init() first");
    
    const c1a = [F.e(ct1.c1[0]), F.e(ct1.c1[1])];
    const c2a = [F.e(ct1.c2[0]), F.e(ct1.c2[1])];
    
    const c1b = [F.e(ct2.c1[0]), F.e(ct2.c1[1])];
    const c2b = [F.e(ct2.c2[0]), F.e(ct2.c2[1])];
    
    const c1sum = babyJub.addPoint(c1a, c1b);
    const c2sum = babyJub.addPoint(c2a, c2b);
    
    return {
        c1: [F.toObject(c1sum[0]), F.toObject(c1sum[1])],
        c2: [F.toObject(c2sum[0]), F.toObject(c2sum[1])]
    };
}
