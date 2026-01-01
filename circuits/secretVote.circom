pragma circom 2.1.5;

include "circomlib/circuits/babyjub.circom";
include "circomlib/circuits/escalarmulfix.circom";
include "circomlib/circuits/bitify.circom";

// Pedersen Commitment: C = vote * G + blinder * H
// Using EscalarMulFix with Base8 for G (the standard BabyJubJub generator)
// This is additively homomorphic: C1 + C2 = (v1+v2)*G + (r1+r2)*H

template PedersenCommitment() {
    signal input vote;      // 0 or 1
    signal input blinder;   // random scalar (< subgroup order)
    signal output out[2];   // commitment point (x, y)

    // Convert blinder to bits for scalar multiplication
    component blinderBits = Num2Bits(253);
    blinderBits.in <== blinder;

    // Convert vote to bits
    component voteBits = Num2Bits(253);
    voteBits.in <== vote;

    // Compute vote * BASE8 (G) using EscalarMulFix
    // BASE8 is the standard BabyJubJub generator used by circomlibjs
    component voteG = EscalarMulFix(253, [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ]);
    for (var i = 0; i < 253; i++) {
        voteG.e[i] <== voteBits.out[i];
    }

    // Compute blinder * H using EscalarMulFix
    // H is a different generator point
    component blinderH = EscalarMulFix(253, [
        17777552123799933955779906779655732241715742912184938656739573121738514868268,
        2626589144620713026669568689430873010625803728049924121243784502389097019475
    ]);
    for (var i = 0; i < 253; i++) {
        blinderH.e[i] <== blinderBits.out[i];
    }

    // Add: vote*G + blinder*H
    component add = BabyAdd();
    add.x1 <== voteG.out[0];
    add.y1 <== voteG.out[1];
    add.x2 <== blinderH.out[0];
    add.y2 <== blinderH.out[1];

    out[0] <== add.xout;
    out[1] <== add.yout;
}

template SecretVote(N) {
    // === Private inputs ===
    signal input vote[N];          // v_i in {0,1}
    signal input blinder[N];       // r_i random scalars

    // === Public inputs ===
    signal input commitments[N][2];  // Pedersen commitments C_i = vote_i*G + blinder_i*H

    // === 1. Enforce one-hot vote vector ===
    signal partialSum[N];
    partialSum[0] <== vote[0];
    for (var i = 1; i < N; i++) {
        partialSum[i] <== partialSum[i-1] + vote[i];
    }
    partialSum[N-1] === 1;

    // Each vote[i] binary
    for (var i = 0; i < N; i++) {
        vote[i] * (vote[i] - 1) === 0;
    }

    // === 2. Verify Pedersen commitments ===
    component pedersen[N];
    for (var i = 0; i < N; i++) {
        pedersen[i] = PedersenCommitment();
        pedersen[i].vote <== vote[i];
        pedersen[i].blinder <== blinder[i];

        commitments[i][0] === pedersen[i].out[0];
        commitments[i][1] === pedersen[i].out[1];
    }
}

component main {public [commitments]} = SecretVote(8);