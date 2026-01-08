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

contract PedersenVoteVectorVerifier_N16 {
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
    uint256 constant deltax1 = 21116199932388995797346340686375185789084212518485473778185953249377127390299;
    uint256 constant deltax2 = 8180138482796177170124719269709860594124448381203300692953399582913381487369;
    uint256 constant deltay1 = 3706077848652445235657811440662406908185270737999034515876475610419971009245;
    uint256 constant deltay2 = 12622665913859434368196793558569823896227677449518630233394765796094908652951;

    
    uint256 constant IC0x = 9731510467912330314983789480956345819404862017703638536528900627151347073556;
    uint256 constant IC0y = 17704112069524769329947786468084619891052899333214704468868067350042370224098;
    
    uint256 constant IC1x = 1882610231791489341569122974938400735742348701724536258690567880673255652263;
    uint256 constant IC1y = 6769686885715809273857274771980284130133514016661331040066451589041228085654;
    
    uint256 constant IC2x = 11584739577670297603781562593093109338325141617080241902858270976285650947954;
    uint256 constant IC2y = 9651750555084971607221877113564242072877058837003044909439064135512394718751;
    
    uint256 constant IC3x = 527302025817816864778649184635453861822720930578969785344918978939749883329;
    uint256 constant IC3y = 5258051367536167643736315386928597736935457888869414150280458459612659308452;
    
    uint256 constant IC4x = 31377335312986815963424801503651678982301965744253269965383367925871168759;
    uint256 constant IC4y = 19752820965752147424641126922593390733508278858893981557996271453572501043939;
    
    uint256 constant IC5x = 15443456480857510601785016986681341100517955546902668490158887171426676943838;
    uint256 constant IC5y = 13555695410228855079285526174187017501526917184627893939690936641528523791422;
    
    uint256 constant IC6x = 10245063885467936586759488502833293626562122317684700309417995933999145627587;
    uint256 constant IC6y = 5026609897743838515902801298956297447649325947170271897418141873009906819797;
    
    uint256 constant IC7x = 9916566924552663535522825345964016035091919685400416621316140501095800140886;
    uint256 constant IC7y = 11896471277805684907067785908286469729898603803090820967651473821630924925386;
    
    uint256 constant IC8x = 19726928468768498709221261352574708147412317397221257179213181287058050911947;
    uint256 constant IC8y = 13412161795650575246009081929437209429782663049810628605911721509410393492242;
    
    uint256 constant IC9x = 2352579828275690499538565219361672112929048358232554572791227541843632943509;
    uint256 constant IC9y = 19057701606268389550878300393151302196605032369202095235236752118084919921020;
    
    uint256 constant IC10x = 6547704801264565921282803536035026509287574977429650669825961357906303666890;
    uint256 constant IC10y = 17804382078542658157593638158178927423880351745153242341603371956143556693324;
    
    uint256 constant IC11x = 21266341313790066975875009056214549239950931445234791667100545459406922850672;
    uint256 constant IC11y = 1092824932610984676842970376860007358939546045760412692632855417285021973925;
    
    uint256 constant IC12x = 9811079093993642484515470673011397306106616649983573295923449788172012762538;
    uint256 constant IC12y = 15973287940318944675912398411196492901068463122785438649756353390394115571308;
    
    uint256 constant IC13x = 21482369019435739159296853601515361721354201087297973549191249143530130057420;
    uint256 constant IC13y = 1792593577219764687274070872152507282227122462869604874595682046086612862959;
    
    uint256 constant IC14x = 4802132006266110092020476888508947543866049971372483219492230870940447217011;
    uint256 constant IC14y = 13285923886118942944474875447557836373338029932700792543813694909667862969964;
    
    uint256 constant IC15x = 14551038190015537391563405695076686343433312895613096890753306776958993789019;
    uint256 constant IC15y = 209545362261249101573689149911521827781876918464818024948308476575259334682;
    
    uint256 constant IC16x = 5848756530740112480949102750211973280921839081194359064137606271731369912443;
    uint256 constant IC16y = 91557111750321612031337329152584498174579956341353509267471300678319661405;
    
    uint256 constant IC17x = 15558348837527099918046189648735995616882000009741656487209731012533799310204;
    uint256 constant IC17y = 13742597599272120978603105517877709759816706364916012351412797836594439391060;
    
    uint256 constant IC18x = 21529488593097800168959870686488654722176906545595210256409817526433176926744;
    uint256 constant IC18y = 16838678535129632885229420539742142222147044811265344332119790537949011495517;
    
    uint256 constant IC19x = 12439715997855970827695471074280996292464877990092029123766533570445213287356;
    uint256 constant IC19y = 11411540327687146362644744280544343147331521608628751751891809760472299828441;
    
    uint256 constant IC20x = 14932402082902509666423517489689962462694474756063742506323723417296679110600;
    uint256 constant IC20y = 13883480239432015003041148230980387159700005412325208223203451124463123550913;
    
    uint256 constant IC21x = 14771471612023422344586665895264449861973529306269149131455296933764783568425;
    uint256 constant IC21y = 19721975237638641525045961098988050254385256115363355690207910252808747104948;
    
    uint256 constant IC22x = 6223114643968445283007343688003525482460876425644022852370411034806817694640;
    uint256 constant IC22y = 7384504668043311818335505897846854930929313622165442351946980342702234517384;
    
    uint256 constant IC23x = 10951259646786739408722614913668072470172841487675231377749192421155727597094;
    uint256 constant IC23y = 6227151354388017718207994693252747641755861487812552671800062252750674557887;
    
    uint256 constant IC24x = 17738250972548413599170135016194774229501664196074200912712081315075569347734;
    uint256 constant IC24y = 14340630847953307555224399981992297641633534202739119272102339829126904005857;
    
    uint256 constant IC25x = 810387806833033631518332529402355295370705258385403536522018429427645836876;
    uint256 constant IC25y = 4131462990975601575354870533805526978735932996467234757641861001460167800925;
    
    uint256 constant IC26x = 14227095842695695590374072650776689601327491917599500249187691353909224267442;
    uint256 constant IC26y = 18900051896460643164106367297325929749250092518392883880113911395788730293539;
    
    uint256 constant IC27x = 1908739017717685065549767336727351039879195748550252760115899794659318319289;
    uint256 constant IC27y = 4442885572087935107812470393659561845730238356533581269113233346652271571723;
    
    uint256 constant IC28x = 8878725325816052405803902414607843224854400937063410806217366758596605553589;
    uint256 constant IC28y = 17969738809371987211170963353027697089262547787139110613855227699771840736040;
    
    uint256 constant IC29x = 21008937631679585904358261229095913551462352555069565363076996682929735104887;
    uint256 constant IC29y = 907008875441164180927538381124222891780803971590800638135682301400580264340;
    
    uint256 constant IC30x = 3253756889090103165850020609232937369241739939519997598813083019549697268146;
    uint256 constant IC30y = 10132846758085621754188251105117862166725263833531685327399642065163685465284;
    
    uint256 constant IC31x = 12068704799554190511309718642386786430448582262734908633965502781527287800890;
    uint256 constant IC31y = 17881419324873312229758126683892412394447556084833158437860883395049236897976;
    
    uint256 constant IC32x = 9863586346219404435123960380597177231849417734780779448076694534845102370792;
    uint256 constant IC32y = 16855310848810082082752986619222000413594586456778804800476677350594846183051;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[32] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                

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
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
