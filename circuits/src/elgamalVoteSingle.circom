pragma circom 2.1.5;

include "elgamal.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template ElGamalVoteSingle(N) {
    // --- Public inputs ---
    signal input pk[2];             // Poll Owner Public Key

    // --- Private inputs ---
    signal input selectedOption;    // Which option to vote for (0 to N-1)
    signal input r;                 // Encryption randomness

    // --- Outputs ---
    signal output c1[2];            // ElGamal C1 = r * G
    signal output c2[2];            // ElGamal C2 = r * PK + 1 * G
    signal output optionHash;       // Hash of selected option for aggregation

    // --- 1. Validate selectedOption is in range [0, N) ---
    component rangeCheck = LessThan(8);
    rangeCheck.in[0] <== selectedOption;
    rangeCheck.in[1] <== N;
    rangeCheck.out === 1;

    // --- 2. Encrypt vote (always m=1) ---
    component enc = ElGamal();
    enc.pk[0] <== pk[0];
    enc.pk[1] <== pk[1];
    enc.r <== r;
    enc.m <== 1;  // Always encrypt vote=1

    c1[0] <== enc.c1[0];
    c1[1] <== enc.c1[1];
    c2[0] <== enc.c2[0];
    c2[1] <== enc.c2[1];

    // --- 3. Hash the selected option ---
    component hasher = Poseidon(1);
    hasher.inputs[0] <== selectedOption;
    optionHash <== hasher.out;
}

component main {public [pk]} = ElGamalVoteSingle(8);
