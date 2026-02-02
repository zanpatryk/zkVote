// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract PedersenVoteVectorVerifier_N8 {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 8668951873953489358768752254548205367372477461412841563416068149345761469992;
    uint256 constant deltax2 = 18409768397930047445796790339963871246010465123037767133794811156437163949797;
    uint256 constant deltay1 = 231420442338950979001649200901052940773640312543050103463897254200232238254;
    uint256 constant deltay2 = 17000436094512501343859744903447548481443592223702695462551444925236095949762;

    
    uint256 constant IC0x = 20994385824625327263330056029047667711730701096323516347988097352857686031345;
    uint256 constant IC0y = 9130721619770852473113693913946419500514728951945329452084595543891280446172;
    
    uint256 constant IC1x = 13837452667870787119847058858263917637628943201820399338411577897543068214723;
    uint256 constant IC1y = 20330282880697219395756227503336073575994243949447255282671347664099070544102;
    
    uint256 constant IC2x = 20661455756438190805674867928166760053280423409157629745804202382952436841620;
    uint256 constant IC2y = 9744256560117615239762666907411427798511117852477133467801427391574380528238;
    
    uint256 constant IC3x = 10384039677758004257602411890675005195226743466645778707225748729767405395138;
    uint256 constant IC3y = 11162423307789951007638311536401783826576853053695764930042899464233437999619;
    
    uint256 constant IC4x = 20560629801184135677602136855163566486611568622976186416023753019976764909418;
    uint256 constant IC4y = 16757613354539890547046438114110920495377960937788146843708761177536424514196;
    
    uint256 constant IC5x = 5708241973173245397706109965688648739102275113785864667628460208193807382726;
    uint256 constant IC5y = 3435710257184474987532961478909386199487257402018583126985252407290207593361;
    
    uint256 constant IC6x = 2857447884718060591770993404277437111584170175349623369754286712007898224459;
    uint256 constant IC6y = 14430212909062941401317730115487563453827473692705348614882350217506334131217;
    
    uint256 constant IC7x = 14524355107649874420397333221376302124099810297526058577444387750147067546091;
    uint256 constant IC7y = 4487131774843943050069888608768892199054515427767035904962976487109799124881;
    
    uint256 constant IC8x = 13460272149252726687927735967184862349416020976988312293174302294771888559804;
    uint256 constant IC8y = 1080445646310136382095345484926488399721744013555466971173085364257819313440;
    
    uint256 constant IC9x = 896281196254410827354055803249465624177127065673549524710881923452024930649;
    uint256 constant IC9y = 15344892743312150002942877507027004061229717980492036879472871865076991664840;
    
    uint256 constant IC10x = 21551614915503329910485171690162490246580587796985924675731870236932317772350;
    uint256 constant IC10y = 17644836321670342622544188086420276573068481643689847276055659359803950395778;
    
    uint256 constant IC11x = 16041781234330943534177805824615022915887160890476410119106437536761815773977;
    uint256 constant IC11y = 10527389824117052444026920242840242703719117041998080714969905744339365690714;
    
    uint256 constant IC12x = 17437525849673510898266950146366060631873020548935475260977733922234318737651;
    uint256 constant IC12y = 4672029057126369465633582769079134951411772891207525280715426349878112221720;
    
    uint256 constant IC13x = 13425500902834518312004605245194808653268512935483961816296022667847960897654;
    uint256 constant IC13y = 5682122005965755528418985953076676611368806609480379049842736271459678371213;
    
    uint256 constant IC14x = 10672552340198560813780641445623933819112968474942877358764531616712892902710;
    uint256 constant IC14y = 14839404370088784721507667050551076897987386398382961374561365130159399388388;
    
    uint256 constant IC15x = 11701666521108430466106012689338387141864992071049579344705770759648518393216;
    uint256 constant IC15y = 15330457932437122744426486584439727187106952644724113293408001001911392163771;
    
    uint256 constant IC16x = 11261165547406446196835640007293106858387750425356944553369622055310279854563;
    uint256 constant IC16y = 9775982476285202362144070923110400771861969083851103429062907192991788950599;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[16] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
