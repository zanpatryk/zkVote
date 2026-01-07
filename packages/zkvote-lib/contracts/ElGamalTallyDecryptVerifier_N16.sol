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

contract ElGamalTallyDecryptVerifier_N16 {
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
    uint256 constant deltax1 = 2345817253577515396464973142833978519081697689471933908022196273401272195463;
    uint256 constant deltax2 = 21087174119196215168780784742391727269168329890799824548096846057827228901497;
    uint256 constant deltay1 = 2597464200607828964702358551276108022341863089405025318995957262166812953900;
    uint256 constant deltay2 = 19184811434632742859174094230203293891041852206064658112330264473212357490304;

    
    uint256 constant IC0x = 9690212096292895149710446707034780774326241733467365843367602155451499294980;
    uint256 constant IC0y = 2287769014953515602124025070539583345334882062962641620841925706409630955473;
    
    uint256 constant IC1x = 2694678049457944559959329538447010721276353918342845315196502301716978118864;
    uint256 constant IC1y = 8578338260392266392440890741492915168335853366338507243108633495323504855081;
    
    uint256 constant IC2x = 14670554973201837863983421409302149225234076091438893792855410163661166960458;
    uint256 constant IC2y = 21850111849436604475144270158223291223331446859845918291332245268208850737122;
    
    uint256 constant IC3x = 7255520127966045610624617859988429988497057409317722214000661452298630688312;
    uint256 constant IC3y = 3505999691156335857289093361776974700488850548657427309760029329564903842966;
    
    uint256 constant IC4x = 3391304007788095770735396875462081912653399112682102549344877910687538557084;
    uint256 constant IC4y = 12127982330308593009790128074484992945891548810467817034000214489192357674582;
    
    uint256 constant IC5x = 4865273692333063710981682807734591646919972231916594680505060915925204504459;
    uint256 constant IC5y = 14576445832209917802965387602369661497297859213409576511635657934088671880111;
    
    uint256 constant IC6x = 15173440372756682116076710971883395845586154573390817877477936786064442872042;
    uint256 constant IC6y = 21132793575366375736976862303585312928718154283012096653771400871306364587298;
    
    uint256 constant IC7x = 20262865762872794501729938894282339293594312407450663786833921662735010321906;
    uint256 constant IC7y = 11643247929215004299440667822921207541829673685782877464930952891252512763743;
    
    uint256 constant IC8x = 8478365762569268508861383076009438735042370315253030444373880456063734664891;
    uint256 constant IC8y = 16267469147242512924657099543116151662220314694836352990852025958739068458048;
    
    uint256 constant IC9x = 728713011702938567354296351744858083444402100064233315327178349796825758694;
    uint256 constant IC9y = 3242418239043060425403561385894474710351217135386371803936340430722237167932;
    
    uint256 constant IC10x = 10844917521555614234841904745249332057926582146580093721996546909460313007715;
    uint256 constant IC10y = 19619537189335937060905311194994284040284023249013436706894463164594737050080;
    
    uint256 constant IC11x = 10979061951580719349886541742794308617311978638382003196829334897496656614740;
    uint256 constant IC11y = 12194929808449343826035200818117977166339886071000495054578855641293086436029;
    
    uint256 constant IC12x = 9964101898194905414437560235422127857897351250061886276643263638525942499143;
    uint256 constant IC12y = 5650848875845407023635178438493093885389156348573595415646602262468241891058;
    
    uint256 constant IC13x = 6154305202826705757999126903053771358976680358682739720314988251415801353501;
    uint256 constant IC13y = 2119966372643374195390747656617967013255006796087582359532427095366885835404;
    
    uint256 constant IC14x = 8306303708533581407991052759479696675972857003888813539222529809084985247804;
    uint256 constant IC14y = 390462328377635249053186714149166613578627252360301262219522961206415613875;
    
    uint256 constant IC15x = 1056341262006055021184499345033558823896486494200177526537094897127040268597;
    uint256 constant IC15y = 10684515285245772626138315170270397275926938248925898842572872321589921452687;
    
    uint256 constant IC16x = 20969412833530814619488161176795416750906078908675109078949323965185459783997;
    uint256 constant IC16y = 20279372936475782631632256192383395203538380965697701907331915770321645292828;
    
    uint256 constant IC17x = 14450902968638828850695751333673971330379247490742359638513644115083276971813;
    uint256 constant IC17y = 5256086811939796416079080022509567113230810853520238083867625487323713795271;
    
    uint256 constant IC18x = 11504880954772974427406023416192638449465275616595648090127776989008566916577;
    uint256 constant IC18y = 8015551403609386111816757007695909113152665896853656588984833657109896636247;
    
    uint256 constant IC19x = 15537622784966773721982290431550519691668619197612871603284940584849262629846;
    uint256 constant IC19y = 20099941204840341060917064362153990402366322915483311622406594378800524199843;
    
    uint256 constant IC20x = 4254635548689690242256998627025236384006371828035392190969404449518229657352;
    uint256 constant IC20y = 7920803800857933333180733546383293160035037322347824760194171337994935478591;
    
    uint256 constant IC21x = 11665244211606721986163378831891727082577104313088597651403950798915323618835;
    uint256 constant IC21y = 851032720347179367486542646159653793847432652922506979115999700416182343635;
    
    uint256 constant IC22x = 6613959874940014169516499828454696478400362312424273502028061893034966346655;
    uint256 constant IC22y = 3730602226428800700569239748372611615299986414947129294742232065944040614378;
    
    uint256 constant IC23x = 5910568100539717565890483045488293993002194098859368726984364218028517574627;
    uint256 constant IC23y = 300522739580894769065308066945593632805031887007812552981109347645531861503;
    
    uint256 constant IC24x = 10553292040624276701286643967539882438479372596160136325617294568946047681853;
    uint256 constant IC24y = 20863610985003029156848279614796723037364220149128284484578299762912270493643;
    
    uint256 constant IC25x = 5529656875493839083568707233401039829575088312485777670728804306225534778794;
    uint256 constant IC25y = 16802565808685606675959797920886622082055807790748921135718431926381478114763;
    
    uint256 constant IC26x = 11262747857180835075159739604915550757156481776747552402674248881591438849015;
    uint256 constant IC26y = 12018288197309028257238116906597825912332454746978114455053550953154397094640;
    
    uint256 constant IC27x = 1147969521058048963021494496384512485992506327289160217816950381467762578335;
    uint256 constant IC27y = 15319428105023104501431885077798641132242205043336290440082767555609737169272;
    
    uint256 constant IC28x = 1519322880356790994441464339487637144250800094017092262415351749170068193599;
    uint256 constant IC28y = 14813875975626672569708189846248212552793662848154563420737381732511092460921;
    
    uint256 constant IC29x = 19041727205028566157816387975338851231357908293212948473340905998435119843326;
    uint256 constant IC29y = 20399533592670473117480113432905420381823434669883640973886581422257066509451;
    
    uint256 constant IC30x = 16470942465902046919105336563538598510817591511164973092531439738299430014522;
    uint256 constant IC30y = 11618766415916274708348017115431434522320239199739419315352824508340470718761;
    
    uint256 constant IC31x = 18647393854442285577450206193691202445779149677780803205605619659781929524986;
    uint256 constant IC31y = 16994525549867419092168295774932333278134188088668697157666468203070054459188;
    
    uint256 constant IC32x = 11273025314146186441065358634165194385901971356471623434970494208547492001935;
    uint256 constant IC32y = 4169567976674328014915544899463769103424833758446380154808578942806393443316;
    
    uint256 constant IC33x = 2537704634847182183495828652397273591994796206012864944311777680861092985756;
    uint256 constant IC33y = 6866873901865851870456883746458947128850289728870403113994286473328484937039;
    
    uint256 constant IC34x = 5681908178316942591971555358954832255795990213677256976553568852811068310234;
    uint256 constant IC34y = 14364554836261632589683769286193742631318054279143934475822328697556255869655;
    
    uint256 constant IC35x = 2821059554801440541595436497688576325212985430589148611488401767424430848578;
    uint256 constant IC35y = 18815456448275806436165664191186314384792794780561191356126159520101371551307;
    
    uint256 constant IC36x = 20751766232883653859006198980352865305355496249938975255608150688868919175147;
    uint256 constant IC36y = 6524978468091707398017217852496275577324945571716131704397643232628044717114;
    
    uint256 constant IC37x = 13173334267091260391941632762226489820833163025112313813606837930507186174345;
    uint256 constant IC37y = 9285565022808363990893570747895781966082621251321205928712697092092660662745;
    
    uint256 constant IC38x = 14739316344742424053779835758376617959643425796624754264726526063929877485767;
    uint256 constant IC38y = 16491412909156995002997422821393319033219801437314369674248453719868953298990;
    
    uint256 constant IC39x = 8451104592293212996607839606673087095732437149361863132119028960892568510696;
    uint256 constant IC39y = 16394055312279258491906903294802132545643789419229534881962843285028463011663;
    
    uint256 constant IC40x = 5030601813302045460630302088519121931030422440440688666008796363262796688463;
    uint256 constant IC40y = 11086388622281965519465519852949525175659657932350597271852147251860061089266;
    
    uint256 constant IC41x = 14405822714570306848216540925844342427897853921411575327865738963850423377509;
    uint256 constant IC41y = 8446203069670514924964926000836968082483373144240195511328976576084774547087;
    
    uint256 constant IC42x = 4868022074490079916674501847687993730928755646464120610548573979410108880400;
    uint256 constant IC42y = 10719572645896279148449347318342242063832233573847468446407527519340280733526;
    
    uint256 constant IC43x = 7211360764435382576276274869086519719894789101691228189785161062331144945930;
    uint256 constant IC43y = 195688367152734209965592375061352145353544531186378905964779371651041975677;
    
    uint256 constant IC44x = 17527465026097367980560102918367486231313146934635449843014786477238975819268;
    uint256 constant IC44y = 15320471754934259678077014267962603872232453807094636035919242120159837614662;
    
    uint256 constant IC45x = 3664568716874160945810665508967647358800007261944016406207814840210419327640;
    uint256 constant IC45y = 1354886717188611650494671768793198263572882965705048339654276043244182817266;
    
    uint256 constant IC46x = 3506193539982212758309974676545791900550635836910297413657669541200330794743;
    uint256 constant IC46y = 12699332898570847103278997154884638537615852742740162433840511302480010967302;
    
    uint256 constant IC47x = 644631261212435628227846048394132537860530468617328434471441837485503186078;
    uint256 constant IC47y = 10489580371035042245768539075907198180479743136942020929157388500441098683349;
    
    uint256 constant IC48x = 19866177990737058203810478746143138141608842007779066062654960912931607009660;
    uint256 constant IC48y = 4963345212871198601850211618581268754008400139059244241291545236500235583361;
    
    uint256 constant IC49x = 6013989890881393753885487163552995135143832394085950956444940409968145247153;
    uint256 constant IC49y = 1591356639534093044321302943567800565827619951299867957920939366695349288205;
    
    uint256 constant IC50x = 10070880740429238866459663536719223705023651178351583166994979531845168964471;
    uint256 constant IC50y = 12933434812340522066298698943893089166061512600570431262182371337657768200542;
    
    uint256 constant IC51x = 8363017810859269372968783937724618667547595744494484085410846745249749201616;
    uint256 constant IC51y = 15397214077740663857682550817431401408600906871899688684851249491705743958686;
    
    uint256 constant IC52x = 9342601223609971607615574746675084803520389790660597627637121119773474410940;
    uint256 constant IC52y = 7610017677030258868543000334976766410799084317356176742891312242458918410874;
    
    uint256 constant IC53x = 11581816186019392200597295513052928376964775221805570010502211098095090133645;
    uint256 constant IC53y = 2295528135210942252153414542164599005076998733107609972394584390259084028287;
    
    uint256 constant IC54x = 2196456811856722355980405070666319990096821274121833075996656346897444640988;
    uint256 constant IC54y = 2324313997271425331954926194290604906709839631241770736340732663540574726791;
    
    uint256 constant IC55x = 401005145693386518655026256198020697594913165754921555627000630159135885145;
    uint256 constant IC55y = 13806586960478660595120995550375217230039001060320742136829436654694426082965;
    
    uint256 constant IC56x = 12175783429418698168442707569005336720242855410737553079798584858628428579121;
    uint256 constant IC56y = 8244469553308784943193293479182115362281890324942368362810460944752686273627;
    
    uint256 constant IC57x = 3091978806239315987642090126575120105276540377540308490374151208404478797486;
    uint256 constant IC57y = 6221129189129061803442306251662695098721160224890919072457414951356256238967;
    
    uint256 constant IC58x = 11760296140853790810465466003961704268458317293621727439368626816511371629949;
    uint256 constant IC58y = 4347747072995882524816762411226511858986210291238550234896413116450653031988;
    
    uint256 constant IC59x = 6588257453417329050075440345796638103630837384739067549784072507538439172323;
    uint256 constant IC59y = 18130903078802701538111907991126365657169965603265867834319131626395755307426;
    
    uint256 constant IC60x = 3181117491423258350826532044310470551212174216581539735427212336400302804513;
    uint256 constant IC60y = 2318088967471492368041167475404853964952457269128175282545212599506074678206;
    
    uint256 constant IC61x = 4347358583380687943765559471023044050123295664283866806319660155629381507804;
    uint256 constant IC61y = 21804110124604039365442731037424225069097164083394048720927915262604896780183;
    
    uint256 constant IC62x = 8445040940528955110481204937608205345021125738170898318813605446168932833208;
    uint256 constant IC62y = 16739369507464737002079452684823120815859722156165551595463408352274903616466;
    
    uint256 constant IC63x = 17389203500461146120938439973865709871098365641328319749657431602717559560486;
    uint256 constant IC63y = 2199338173075057132087071522756018078355996686796681736740715804864447438170;
    
    uint256 constant IC64x = 2701011983940299221421439599191615203270356420183825792692236327164593859942;
    uint256 constant IC64y = 2205802755128409809900287495604429021395144078692947013184845964030608699320;
    
    uint256 constant IC65x = 15563885483807107349710609687036078257880659486801722277793734286426592614164;
    uint256 constant IC65y = 17507140830916757891401016549850116227288998979201274087617725017011302702574;
    
    uint256 constant IC66x = 15282150107874505164703972300812669667897565840663622983102445634542695463447;
    uint256 constant IC66y = 5001091048321193414627597555214991091965522608260096572507163186311823511334;
    
    uint256 constant IC67x = 4772465002094003547743432496624976162398231691061660486812094885501011485036;
    uint256 constant IC67y = 1434472593503567650804000725527555590501455900125770352396720442756584610848;
    
    uint256 constant IC68x = 19348798698980096217599079548814833607406268939002759021733227720968671016388;
    uint256 constant IC68y = 18743457752540679516862736495326257409610278289012916254566319391777274853933;
    
    uint256 constant IC69x = 20526762730342681076342709113044084811346750988644227303201353004738438071498;
    uint256 constant IC69y = 529934365021674948746275905653654276828370031258676765646101850300925574767;
    
    uint256 constant IC70x = 8555353807444555388922099131124337713968954266988537217169337178029829175388;
    uint256 constant IC70y = 11234988982737807572668280378750048551513232403102491590770582306855624393293;
    
    uint256 constant IC71x = 14601963341483383621555852735973029914870411106705595998643788511722175823655;
    uint256 constant IC71y = 13813965431186652497189006691846615538635956971568187685581591304077694602411;
    
    uint256 constant IC72x = 17750595834118949292094248735786852273252600753050281711511030846532463771643;
    uint256 constant IC72y = 13293141225499098798984350111255629928141254000255556294194082487124822529946;
    
    uint256 constant IC73x = 16837533863659781966173259450603887925263833775279438879162078417211674601105;
    uint256 constant IC73y = 8577391850161794753168518873152395556410738975805647621277803171192395073818;
    
    uint256 constant IC74x = 17178576911168862621171020984886430710135230764803350785227466496710515083426;
    uint256 constant IC74y = 5988202197973986438869734563044099628081131464277942117948837351554254080495;
    
    uint256 constant IC75x = 1695010492041947017085296672869056889450895619599788028167260488450718039863;
    uint256 constant IC75y = 5786220110896349864751007195088188630015681639070886612678558802781373369732;
    
    uint256 constant IC76x = 15053264720251875028397095341364852044664526586951120080151278617058420365073;
    uint256 constant IC76y = 910377326157864931371576327364427417622937417838729373940895028437978754462;
    
    uint256 constant IC77x = 19951689579013644934838562982566067634344102958712449173752577147230058158141;
    uint256 constant IC77y = 5368446786680218135546275185999516476443871957083433063858164669088294768849;
    
    uint256 constant IC78x = 15240211026094116347054301652883224205921737616636652129068952031847280746126;
    uint256 constant IC78y = 494642460629120524117157614251773947017807741088510014398578871327545986117;
    
    uint256 constant IC79x = 3553962193519842656530727654798571571284672130056232626759441044957704790844;
    uint256 constant IC79y = 10548147351924199023981661400262810494839638366275190984549613842684842343271;
    
    uint256 constant IC80x = 19419532161533304411535676055651591186689500727300682026683975138171308173443;
    uint256 constant IC80y = 19608125891252313629560056853663572557893180135251021240777516168096229215836;
    
    uint256 constant IC81x = 17084066795110779000090045342434463483731623588568693762489125293211628030034;
    uint256 constant IC81y = 6731775422868902084942913688272212942260476104889971379780854467734143300856;
    
    uint256 constant IC82x = 7578307563259312512088941946453127116907845811975133258609160484307399565704;
    uint256 constant IC82y = 20309072997463027657401354489030488956351364610878153505108152337027206884701;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[82] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                
                g1_mulAccC(_pVk, IC52x, IC52y, calldataload(add(pubSignals, 1632)))
                
                g1_mulAccC(_pVk, IC53x, IC53y, calldataload(add(pubSignals, 1664)))
                
                g1_mulAccC(_pVk, IC54x, IC54y, calldataload(add(pubSignals, 1696)))
                
                g1_mulAccC(_pVk, IC55x, IC55y, calldataload(add(pubSignals, 1728)))
                
                g1_mulAccC(_pVk, IC56x, IC56y, calldataload(add(pubSignals, 1760)))
                
                g1_mulAccC(_pVk, IC57x, IC57y, calldataload(add(pubSignals, 1792)))
                
                g1_mulAccC(_pVk, IC58x, IC58y, calldataload(add(pubSignals, 1824)))
                
                g1_mulAccC(_pVk, IC59x, IC59y, calldataload(add(pubSignals, 1856)))
                
                g1_mulAccC(_pVk, IC60x, IC60y, calldataload(add(pubSignals, 1888)))
                
                g1_mulAccC(_pVk, IC61x, IC61y, calldataload(add(pubSignals, 1920)))
                
                g1_mulAccC(_pVk, IC62x, IC62y, calldataload(add(pubSignals, 1952)))
                
                g1_mulAccC(_pVk, IC63x, IC63y, calldataload(add(pubSignals, 1984)))
                
                g1_mulAccC(_pVk, IC64x, IC64y, calldataload(add(pubSignals, 2016)))
                
                g1_mulAccC(_pVk, IC65x, IC65y, calldataload(add(pubSignals, 2048)))
                
                g1_mulAccC(_pVk, IC66x, IC66y, calldataload(add(pubSignals, 2080)))
                
                g1_mulAccC(_pVk, IC67x, IC67y, calldataload(add(pubSignals, 2112)))
                
                g1_mulAccC(_pVk, IC68x, IC68y, calldataload(add(pubSignals, 2144)))
                
                g1_mulAccC(_pVk, IC69x, IC69y, calldataload(add(pubSignals, 2176)))
                
                g1_mulAccC(_pVk, IC70x, IC70y, calldataload(add(pubSignals, 2208)))
                
                g1_mulAccC(_pVk, IC71x, IC71y, calldataload(add(pubSignals, 2240)))
                
                g1_mulAccC(_pVk, IC72x, IC72y, calldataload(add(pubSignals, 2272)))
                
                g1_mulAccC(_pVk, IC73x, IC73y, calldataload(add(pubSignals, 2304)))
                
                g1_mulAccC(_pVk, IC74x, IC74y, calldataload(add(pubSignals, 2336)))
                
                g1_mulAccC(_pVk, IC75x, IC75y, calldataload(add(pubSignals, 2368)))
                
                g1_mulAccC(_pVk, IC76x, IC76y, calldataload(add(pubSignals, 2400)))
                
                g1_mulAccC(_pVk, IC77x, IC77y, calldataload(add(pubSignals, 2432)))
                
                g1_mulAccC(_pVk, IC78x, IC78y, calldataload(add(pubSignals, 2464)))
                
                g1_mulAccC(_pVk, IC79x, IC79y, calldataload(add(pubSignals, 2496)))
                
                g1_mulAccC(_pVk, IC80x, IC80y, calldataload(add(pubSignals, 2528)))
                
                g1_mulAccC(_pVk, IC81x, IC81y, calldataload(add(pubSignals, 2560)))
                
                g1_mulAccC(_pVk, IC82x, IC82y, calldataload(add(pubSignals, 2592)))
                

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
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            
            checkField(calldataload(add(_pubSignals, 1632)))
            
            checkField(calldataload(add(_pubSignals, 1664)))
            
            checkField(calldataload(add(_pubSignals, 1696)))
            
            checkField(calldataload(add(_pubSignals, 1728)))
            
            checkField(calldataload(add(_pubSignals, 1760)))
            
            checkField(calldataload(add(_pubSignals, 1792)))
            
            checkField(calldataload(add(_pubSignals, 1824)))
            
            checkField(calldataload(add(_pubSignals, 1856)))
            
            checkField(calldataload(add(_pubSignals, 1888)))
            
            checkField(calldataload(add(_pubSignals, 1920)))
            
            checkField(calldataload(add(_pubSignals, 1952)))
            
            checkField(calldataload(add(_pubSignals, 1984)))
            
            checkField(calldataload(add(_pubSignals, 2016)))
            
            checkField(calldataload(add(_pubSignals, 2048)))
            
            checkField(calldataload(add(_pubSignals, 2080)))
            
            checkField(calldataload(add(_pubSignals, 2112)))
            
            checkField(calldataload(add(_pubSignals, 2144)))
            
            checkField(calldataload(add(_pubSignals, 2176)))
            
            checkField(calldataload(add(_pubSignals, 2208)))
            
            checkField(calldataload(add(_pubSignals, 2240)))
            
            checkField(calldataload(add(_pubSignals, 2272)))
            
            checkField(calldataload(add(_pubSignals, 2304)))
            
            checkField(calldataload(add(_pubSignals, 2336)))
            
            checkField(calldataload(add(_pubSignals, 2368)))
            
            checkField(calldataload(add(_pubSignals, 2400)))
            
            checkField(calldataload(add(_pubSignals, 2432)))
            
            checkField(calldataload(add(_pubSignals, 2464)))
            
            checkField(calldataload(add(_pubSignals, 2496)))
            
            checkField(calldataload(add(_pubSignals, 2528)))
            
            checkField(calldataload(add(_pubSignals, 2560)))
            
            checkField(calldataload(add(_pubSignals, 2592)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
