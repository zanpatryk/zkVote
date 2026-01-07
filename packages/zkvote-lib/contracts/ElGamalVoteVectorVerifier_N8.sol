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

contract ElGamalVoteVectorVerifier_N8 {
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
    uint256 constant deltax1 = 4416660469469324086007161708086714614514039854262697613064556843207165228177;
    uint256 constant deltax2 = 14134958516452580429680336440969294464761341402897040604214438227078897688586;
    uint256 constant deltay1 = 5995473083128069037100150684973859936930799415582167078120487618826857616940;
    uint256 constant deltay2 = 3006534890770897234000895771430719869456295340034392525343365921127173783080;

    
    uint256 constant IC0x = 7553345085291774643807959631685678734004240648512224380848417736518044793340;
    uint256 constant IC0y = 2900640137511552923507161113941520533277940542708744255179557821411586553352;
    
    uint256 constant IC1x = 18948901900001565201522832777256900802690340845109484071024242978378522181604;
    uint256 constant IC1y = 1961228015168704186487799891825895328675534425826855074511407062729518993840;
    
    uint256 constant IC2x = 21513405597726354558885593084800644734074211314990296492373304844344911278758;
    uint256 constant IC2y = 18486110788410930876881428932044456527336019948410738404200650963948810772692;
    
    uint256 constant IC3x = 10061424532937345340224324594428898514293885679620306788488640173688614695668;
    uint256 constant IC3y = 2842722084399664981280721875824702423553618102159331760222930183245744321263;
    
    uint256 constant IC4x = 10251509983440930565070724402238354450186414073207347725042778741916858076007;
    uint256 constant IC4y = 15814842671097814668800960649126802442411110762544498315448029574841721393568;
    
    uint256 constant IC5x = 20865344852466374993559055535932419421194892603608226325576082411028237650801;
    uint256 constant IC5y = 7515033108065688828920839047131618560448486821078417898828836418002156056148;
    
    uint256 constant IC6x = 6431722024925248624141951736619774850407342676705167257290954889350179033020;
    uint256 constant IC6y = 16880499446524647971795056952499588815507663780233943501395046723854211987228;
    
    uint256 constant IC7x = 1369669176621102934845344328749153675933909744865483933115843648149569522169;
    uint256 constant IC7y = 12507517990229934360668024705787250505199722315166835028296004478675824529712;
    
    uint256 constant IC8x = 5447299917801997294175014037478761879904421072140356063274658183607196307746;
    uint256 constant IC8y = 21247911816594416921066261028690249735136398726844528764362907244487927312616;
    
    uint256 constant IC9x = 10681689182212637296184472498431601206680576635984839518093339498450403393210;
    uint256 constant IC9y = 9465331647475488448843297420419102994084750053840500220909894311046596021095;
    
    uint256 constant IC10x = 5955106280179178158724414384437157481825634557855042443854587066234123478461;
    uint256 constant IC10y = 10330071190612597404723751838100582706768549885212598434098089022665579194674;
    
    uint256 constant IC11x = 2802708086595341697376820016232603879123648348587606402085088451508019033860;
    uint256 constant IC11y = 9490975378280180529554306312492698869797613383731241709908220497467863790394;
    
    uint256 constant IC12x = 10200335975705324437747688242859984974160857362698956530953161207411905715528;
    uint256 constant IC12y = 19127507626053236270837431004184895436249206961689699490795815906926493784205;
    
    uint256 constant IC13x = 14113819212818256735722195890683095426522266132967784395487922226702632696662;
    uint256 constant IC13y = 9501567127160194015124869611957822669144808958669611196712158006087273647704;
    
    uint256 constant IC14x = 13405352939171520039867528773085928283409042808135135741602467533421169914474;
    uint256 constant IC14y = 2268731571036313226810771441480177081533458696927199543447045347724069734834;
    
    uint256 constant IC15x = 20476835947523288828358455927149692930206090297606269447951335105996456173760;
    uint256 constant IC15y = 17797977472360914236020200734503351784231345038190396735370651440998155718182;
    
    uint256 constant IC16x = 4815407265514259105946929811353257108812867540866151410723181628072187671931;
    uint256 constant IC16y = 3520287373935770193065957349188022077230118926691709702313253738838341356221;
    
    uint256 constant IC17x = 7569273901617101476265334616407535840609141204847537208949984195179193124361;
    uint256 constant IC17y = 17310749962615682877681182236868205522443143417145669064247045185295439230384;
    
    uint256 constant IC18x = 15234864955609443692422820312131455990503972046067237123985610051483972561731;
    uint256 constant IC18y = 14304093659707135925553732500653310255246754307040513658632180150891638449023;
    
    uint256 constant IC19x = 19429461926210974320621600591562027544751978700633576889040718012255121405263;
    uint256 constant IC19y = 3902654981757380463357451352169017274058726691794308757149216051442889259883;
    
    uint256 constant IC20x = 20612737169454030142292219843844727180903554240159252170813584242222236963853;
    uint256 constant IC20y = 11990272401362897051356738064557358650860044451580141509123259902144155981674;
    
    uint256 constant IC21x = 4730109663663438811665661663555261935479320381365058738430727839509652505100;
    uint256 constant IC21y = 6441453828343475428291985076907625635431870702139742075670722748207180391900;
    
    uint256 constant IC22x = 6702158347560599217946447459869698370216270594666132371581667162984543293289;
    uint256 constant IC22y = 11884426728764631448810847868552077721921380337242104598261718954590345215887;
    
    uint256 constant IC23x = 4352906729422850507263409055434315558968316251931010890352339130712407658715;
    uint256 constant IC23y = 8529382955949835363473308439085845946901212410353648962906869963901918727395;
    
    uint256 constant IC24x = 3370025985339543211236212689274345034176089296653348507447024326824410506386;
    uint256 constant IC24y = 17587980304653476045317227852191280192464838295855440397432370514635485822312;
    
    uint256 constant IC25x = 14969607823519445614319661690918205612037040628477218941056481915921505351097;
    uint256 constant IC25y = 525356987531563069179692272114726353592250251094334114187745366398430798757;
    
    uint256 constant IC26x = 3950075383761792818060960544759934799030876262130332855440134120268887027116;
    uint256 constant IC26y = 8432191414939450296523406745054262603585887591720307717732866793034269759541;
    
    uint256 constant IC27x = 19241091675212676158821838288107538838150667980391113359564377989380089251050;
    uint256 constant IC27y = 3415774715725560563651119588290234030759114525106204366033289270944185093294;
    
    uint256 constant IC28x = 1779569959119105745094989771455496842097056628194131748453704419995361239656;
    uint256 constant IC28y = 9760960227374612747481949645189853101835123121766154013674136765842062917145;
    
    uint256 constant IC29x = 2491957635542049307870424892545762378133446634894304230411032214419759708487;
    uint256 constant IC29y = 10549361719462781513719512852397636976252675473769736924049727675870856150962;
    
    uint256 constant IC30x = 19238807360625178244165718777552109409383878682903636325087939951622019180740;
    uint256 constant IC30y = 17082533241326847489719344981172545473646015380751423663923705767254168933991;
    
    uint256 constant IC31x = 880902188837521239487561141077745564112413352658080172270070139063538530160;
    uint256 constant IC31y = 20936952443936758738329271989888614418055407310441927386428332710254284452786;
    
    uint256 constant IC32x = 17020311781257088138973072362495932960657957580525295728630143307359101299276;
    uint256 constant IC32y = 15200086363360499154029689520120610814000337936245228059901582213603282994744;
    
    uint256 constant IC33x = 12660583829295201655890256627899492379940667765368891855950001203331943787877;
    uint256 constant IC33y = 6156373089281127316319129774141941614793406926629781747609990886357660542170;
    
    uint256 constant IC34x = 21022185185229542408734748236917739052079275359728430408828777057663070343789;
    uint256 constant IC34y = 19101061079909448238111569335461015624725901695184130984490656488913557771697;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[34] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                

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
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
