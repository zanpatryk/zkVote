// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../../contracts/ZKVoteLib.sol";

// Harness to test internal library functions
contract ZKVoteLibHarness {
    function addPoint(uint256[2] memory p1, uint256[2] memory p2) public pure returns (uint256[2] memory) {
        return ZKVoteLib.addPoint(p1, p2);
    }
}

contract ZKVoteLibTest is Test {
    ZKVoteLibHarness harness;
    
    // BabyJubJub Generator G
    uint256 constant Gx = 5299619240641551281634865583518297030282874472190772894086521144482721001553;
    uint256 constant Gy = 16950150798460657717958625567821834550301663161624707787222815936182638968203;

    function setUp() public {
        harness = new ZKVoteLibHarness();
    }

    function testAddPointDoubleG() public view {
        uint256[2] memory G = [Gx, Gy];
        uint256[2] memory result = harness.addPoint(G, G);
        
        // 2*G on BabyJubJub
        assertEq(result[0], 10031262171927540148667355526369034398030886437092045105752248699557385197826);
        assertEq(result[1], 633281375905621697187330766174974863687049529291089048651929454608812697683);
    }

    function testAddPointNeutral() public view {
        // Neutral element (0,1)
        uint256[2] memory neutral = [uint256(0), uint256(1)];
        uint256[2] memory G = [Gx, Gy];
        
        uint256[2] memory result = harness.addPoint(G, neutral);
        
        assertEq(result[0], Gx);
        assertEq(result[1], Gy);
    }
}
