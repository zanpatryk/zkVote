// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library ZKVoteLib {
    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    // BabyJubJub Prime Field Size (Scalar Field of BN128)
    uint256 public constant Q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    // BabyJubJub Curve Parameters (Twisted Edwards)
    // a * x^2 + y^2 = 1 + d * x^2 * y^2
    // a = 168700
    // d = 168696
    uint256 public constant A = 168700;
    uint256 public constant D = 168696;

    /**
     * @notice Point addition on BabyJubJub curve
     * @param p1 Point 1 [x, y]
     * @param p2 Point 2 [x, y]
     * @return p3 Result [x, y]
     */
    function addPoint(uint256[2] memory p1, uint256[2] memory p2) internal pure returns (uint256[2] memory p3) {
        // Formulas:
        // x3 = (x1*y2 + y1*x2) / (1 + d*x1*x2*y1*y2)
        // y3 = (y1*y2 - a*x1*x2) / (1 - d*x1*x2*y1*y2)
        
        uint256 x1 = p1[0]; uint256 y1 = p1[1];
        uint256 x2 = p2[0]; uint256 y2 = p2[1];
        
        uint256 x1x2 = mulmod(x1, x2, Q);
        uint256 y1y2 = mulmod(y1, y2, Q);
        uint256 x1y2 = mulmod(x1, y2, Q);
        uint256 y1x2 = mulmod(y1, x2, Q);
        
        uint256 dx1x2y1y2 = mulmod(D, mulmod(x1x2, y1y2, Q), Q);
        
        // x3_num = x1y2 + y1x2
        uint256 x3_num = addmod(x1y2, y1x2, Q);
        // x3_den = 1 + dx1x2y1y2
        uint256 x3_den = addmod(1, dx1x2y1y2, Q);
        
        // y3_num = y1y2 - ax1x2
        uint256 ax1x2 = mulmod(A, x1x2, Q);
        uint256 y3_num = addmod(y1y2, Q - ax1x2, Q); // Subtraction via adding negation
        // y3_den = 1 - dx1x2y1y2
        uint256 y3_den = addmod(1, Q - dx1x2y1y2, Q);
        
        p3[0] = mulmod(x3_num, inverse(x3_den), Q);
        p3[1] = mulmod(y3_num, inverse(y3_den), Q);
    }
    
    function inverse(uint256 a) internal pure returns (uint256) {
        // Fermat's Little Theorem: a^(Q-2) = a^-1 (mod Q)
        return pow(a, Q - 2);
    }
    
    function pow(uint256 base, uint256 exp) internal pure returns (uint256) {
        uint256 res = 1;
        while (exp > 0) {
            if (exp % 2 == 1) res = mulmod(res, base, Q);
            base = mulmod(base, base, Q);
            exp /= 2;
        }
        return res;
    }
}

interface IZKVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external view returns (bool);
}
