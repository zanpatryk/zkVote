pragma circom 2.1.5;

include "circomlib/circuits/babyjub.circom";
include "circomlib/circuits/escalarmulfix.circom";
include "circomlib/circuits/escalarmulany.circom";
include "circomlib/circuits/bitify.circom";

// Prove correct decryption of aggregated ElGamal ciphertexts
// without revealing the secret key
template ElGamalDecrypt(N) {
    // --- Public inputs ---
    signal input pk[2];             // Public key
    signal input aggC1[N][2];       // Aggregated C1 per option
    signal input aggC2[N][2];       // Aggregated C2 per option
    signal input tally[N];          // Claimed tally

    // --- Private inputs ---
    signal input sk;                // Secret key

    // Generator G (Base8)
    var Gx = 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    var Gy = 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    // --- 1. Verify pk = sk * G ---
    component skBits = Num2Bits(253);
    skBits.in <== sk;

    component skG = EscalarMulFix(253, [Gx, Gy]);
    for (var i = 0; i < 253; i++) {
        skG.e[i] <== skBits.out[i];
    }
    pk[0] === skG.out[0];
    pk[1] === skG.out[1];

    // --- 2. For each option: verify M = aggC2 - sk*aggC1 == tally*G ---
    component skC1[N];
    component tallyG[N];
    component tallyBits[N];
    component subtract[N];

    for (var i = 0; i < N; i++) {
        // Compute sk * aggC1[i]
        skC1[i] = EscalarMulAny(253);
        skC1[i].p[0] <== aggC1[i][0];
        skC1[i].p[1] <== aggC1[i][1];
        for (var j = 0; j < 253; j++) {
            skC1[i].e[j] <== skBits.out[j];
        }

        // Compute tally[i] * G
        tallyBits[i] = Num2Bits(253);
        tallyBits[i].in <== tally[i];
        
        tallyG[i] = EscalarMulFix(253, [Gx, Gy]);
        for (var j = 0; j < 253; j++) {
            tallyG[i].e[j] <== tallyBits[i].out[j];
        }

        // M = aggC2[i] - sk*aggC1[i]
        // Subtraction: aggC2 + (-skC1) where -P = (-x, y) in twisted Edwards
        subtract[i] = BabyAdd();
        subtract[i].x1 <== aggC2[i][0];
        subtract[i].y1 <== aggC2[i][1];
        subtract[i].x2 <== 0 - skC1[i].out[0];  // Negate x
        subtract[i].y2 <== skC1[i].out[1];

        // Verify M == tally[i] * G
        subtract[i].xout === tallyG[i].out[0];
        subtract[i].yout === tallyG[i].out[1];
    }
}

component main {public [pk, aggC1, aggC2, tally]} = ElGamalDecrypt(8);
