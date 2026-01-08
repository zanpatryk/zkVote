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

contract ElGamalTallyDecryptVerifier_N8 {
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
    uint256 constant deltax1 = 7964325164738963305145471701661375997372668961404405980545947679914569523526;
    uint256 constant deltax2 = 19929494173240204505322491140911394503624571055831181992048110152989801108898;
    uint256 constant deltay1 = 64634504533636377631147575786117290419087802078238409719035599819916093790;
    uint256 constant deltay2 = 3250168261122229407920429162828170793362437853320646612289020818809688207615;

    
    uint256 constant IC0x = 17920940443509016297999806624648574781757999721677611549499026472095907849706;
    uint256 constant IC0y = 1500832405479316971307433172906520504915048772143754932556768663974015318600;
    
    uint256 constant IC1x = 17602013084752854534576061059884202193461407633168180280967879428380679148784;
    uint256 constant IC1y = 1474316720899499114262367768686452830891759300543217559644363025965044265405;
    
    uint256 constant IC2x = 21881754418324174254601155495931009255530170883769825452033959397451699235268;
    uint256 constant IC2y = 4271326787521731458748375397603518066347214744733509950557052745512959427265;
    
    uint256 constant IC3x = 2048999859027452192240156815861768133221439559365408788863354430075008647217;
    uint256 constant IC3y = 9194237511450705902338109366454362624971207359570036822543874170515694803665;
    
    uint256 constant IC4x = 20002728270269585104916919550364580157506880696720892927477360923826470434660;
    uint256 constant IC4y = 7137981093757580758002014767455575523229028983960420423154990093441650136384;
    
    uint256 constant IC5x = 18904382061106290674492047484902044514868056618061048699081746136607223100785;
    uint256 constant IC5y = 4714243011054959705428557203135023436211983159297907396971293355945547527647;
    
    uint256 constant IC6x = 13569976765339330701586481160643972073052291594357517949509517117624887491045;
    uint256 constant IC6y = 1542568042950314670680652246691326930918831751535389020234133619300119826769;
    
    uint256 constant IC7x = 2584447305003756559184594078804087165324630580297473964650517999800439568854;
    uint256 constant IC7y = 406155934955699447287913655158867800173632251123387191740989609220585993674;
    
    uint256 constant IC8x = 7751647028355784249550860498909117644733336199184284950429131445079806632545;
    uint256 constant IC8y = 21769898517965361907346211806553019115986389176227102515752251380541621510076;
    
    uint256 constant IC9x = 19226361371233132929036468613495301918430725106549458807096751774900595489772;
    uint256 constant IC9y = 16316649682914034590037339133832380204250218834996658719463555871921062115572;
    
    uint256 constant IC10x = 14912579397914151161323646931430979334450227093347397528850212127795594124197;
    uint256 constant IC10y = 18525645415734167222901509747046456126639436667403887205083735738306527899897;
    
    uint256 constant IC11x = 14952778901781505635483586813574656256190367041899097153472947310421742083589;
    uint256 constant IC11y = 9862390847175785316020910362273918132789941168154736377006831490381049280808;
    
    uint256 constant IC12x = 11463589527345038484757024103866153213762518589077258592496150306465251967846;
    uint256 constant IC12y = 16933283041654366756521796843442911310773034100389381939175878035678746148102;
    
    uint256 constant IC13x = 20416316568735422661138654903367590049964792018520632390678771664643172074370;
    uint256 constant IC13y = 14317938760875688346767116256153071028511861562778370887719966218103631271161;
    
    uint256 constant IC14x = 5054476147903157313619708591776614078898247810116296442681734445314828582917;
    uint256 constant IC14y = 2609016964385577047943080615264225927574693260194305437630122279309083719854;
    
    uint256 constant IC15x = 17840432363739263695324504816047525806914526067494534670289182699224951300423;
    uint256 constant IC15y = 18434794734725860901522031765318207092876208908177026120765868329760035927420;
    
    uint256 constant IC16x = 20345314753808801364174302123453726346483594122594994463373670589469255826180;
    uint256 constant IC16y = 11122926644457985536852181001293902015066097881325514579481767942484821451766;
    
    uint256 constant IC17x = 9520357932261546110203161007054178670056443615330701872003127327779383358042;
    uint256 constant IC17y = 3976024914457593917085872686760153144922971914545410761631952955388473194294;
    
    uint256 constant IC18x = 11096451551407801617427182453504211813755129164640073716296272086107857772361;
    uint256 constant IC18y = 8525184669204765527851382219507007102495797898278389377619446248058229295092;
    
    uint256 constant IC19x = 6114994747123379350982220447311568277927582076230638166714250610785492918296;
    uint256 constant IC19y = 21037842012841518651058030143380709888748828315397257379529697072014514815991;
    
    uint256 constant IC20x = 13039806600721831412166378468872914846665728552565590350559198529963701223445;
    uint256 constant IC20y = 5937194905306115827131049003939311882372920256044271712604060581683774884721;
    
    uint256 constant IC21x = 9510519663436513320503887384654821764609840949670876838264247193029498210780;
    uint256 constant IC21y = 12987887216160996770674568403079315988823151962615692540945382209736362611692;
    
    uint256 constant IC22x = 14305057329259890110905139339288715595472934657206874897800339867462539215308;
    uint256 constant IC22y = 880927663390912495770500650553026935305505983214916477438605842656691110258;
    
    uint256 constant IC23x = 15728958948881923812840112799069746121565144468350642120097942620359915118761;
    uint256 constant IC23y = 7813833261761148893934837865194317965263493299144308253477140398090733708300;
    
    uint256 constant IC24x = 7516332889993449869270451123690473299553131069527851481172171077328580401612;
    uint256 constant IC24y = 6942128284998355485674723831875746418998086003868594977296144070534742825722;
    
    uint256 constant IC25x = 9523308539311823602593490474470996164242123993824274365913076852868371214923;
    uint256 constant IC25y = 20352347415939273347626428600351810080392641463609738717269539539471794636207;
    
    uint256 constant IC26x = 19196610407869496686186614316690137475655981761650966694360138506564466566122;
    uint256 constant IC26y = 7356240853944459284553844545768630461465965773659044615759695109095498314454;
    
    uint256 constant IC27x = 15892417385506497808157061820810835669444028702331790005389048202799690115648;
    uint256 constant IC27y = 2786967752914132029845524046562528360433595832746004644958222663636336678672;
    
    uint256 constant IC28x = 4935708109259493951722583297195371946593048991817380492044848662672391447834;
    uint256 constant IC28y = 3460034386206600595575822303619827431304667456213829866147548569242165722855;
    
    uint256 constant IC29x = 18317313515123655802951322481346705246266670162734164486329926698395374296546;
    uint256 constant IC29y = 2487881999250489394081186673935123148530140740465960210472044128265905374925;
    
    uint256 constant IC30x = 13831244857458860220608631744783706707258245256277120358568128451595971039469;
    uint256 constant IC30y = 13225516441637487286739983731955447116462154838132562107369685472309352259696;
    
    uint256 constant IC31x = 20388512148244664239820658288655035862215211410712527392051713059049397788012;
    uint256 constant IC31y = 15854185186872527630363199636302483524395385737757559383914469479361090666983;
    
    uint256 constant IC32x = 13191580504792051675857166683547427709107540348508998086037521225261394957729;
    uint256 constant IC32y = 9065966587284062364611918675493620560285187611462980836169515846488363577744;
    
    uint256 constant IC33x = 14370643992448447544524927674631661590460279866386398199920469166948375226927;
    uint256 constant IC33y = 18922369031329875982452204022004171873930055558309327200028728621318462206918;
    
    uint256 constant IC34x = 21886549143513355440274911295060381598521744801764432005461656439471457188084;
    uint256 constant IC34y = 14995324009057606148663081607635046462250874704675914795795170157898507353043;
    
    uint256 constant IC35x = 188223670900424098610338821581197315526522536145045506522023866036592639300;
    uint256 constant IC35y = 5006705125875732948982385988785016803809878736373460032775742993170812026177;
    
    uint256 constant IC36x = 18981832086171478933266276765024525480416246910966938686195561515022451074023;
    uint256 constant IC36y = 9411067633114618309023977416292144785626289617789059405012898350894556848094;
    
    uint256 constant IC37x = 9843313092762471055232961217200178386477678457842331295683198160220023281848;
    uint256 constant IC37y = 863820193840017516110740835988565301315948125826369681056333277345983722314;
    
    uint256 constant IC38x = 2646378692360230899860349490466803992660354011995640156587182640487472279837;
    uint256 constant IC38y = 8535267877444327157900812872697940495799126337561151673735724782071858890297;
    
    uint256 constant IC39x = 2610399978821380102837712427100637721035785826065743287556862664423800995403;
    uint256 constant IC39y = 19764157822218115564041960317166333272658999337284997974126071774848633101921;
    
    uint256 constant IC40x = 14154255444998365105268858797607855008156749237907688093630255103031611266154;
    uint256 constant IC40y = 6604526009406322710457143880181137434328797471397620120978004335535230107706;
    
    uint256 constant IC41x = 7967549143621048784078878146430653364909032039338750735149663205794250383032;
    uint256 constant IC41y = 20848398355455101519507576195240312796339902292088661838094499984917521974711;
    
    uint256 constant IC42x = 1015584729308479488159367370101787775188543064101568902330673409505390184379;
    uint256 constant IC42y = 9030760222287009525693099802912032620889768758486203323495207948632018342456;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[42] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                

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
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
