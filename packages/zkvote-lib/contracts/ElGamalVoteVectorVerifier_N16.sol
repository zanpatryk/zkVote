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

contract ElGamalVoteVectorVerifier_N16 {
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
    uint256 constant deltax1 = 7225542493763271403811829276572474974872621122306541018286167926964450978993;
    uint256 constant deltax2 = 18193670934693370781266260408144607837628529865305321894625664870306141245746;
    uint256 constant deltay1 = 3815589885295992838642404199246891723810152888808942877392417657518559622747;
    uint256 constant deltay2 = 11300083998484221043874976995426468339313380982069366432975090415421428753444;

    
    uint256 constant IC0x = 5227882895766307270722182034765809981740851759249909305181276019366634984617;
    uint256 constant IC0y = 629662558001967642356254509938319353527317282152455259373488085881540801346;
    
    uint256 constant IC1x = 12228987481158800429430106975127353765336662553999163502335114688802121810193;
    uint256 constant IC1y = 18676982587887040196060764908652171073987709679955775389695862643974864966591;
    
    uint256 constant IC2x = 9865046109359164934328007164787728705767184566607345964067087791882581314609;
    uint256 constant IC2y = 13815179729687744647597210433806755370753178368929374179184301216163303606698;
    
    uint256 constant IC3x = 18732234250323789944309220548919309435932253542733749916332628019702185180185;
    uint256 constant IC3y = 13990983874250715990239936921115523901004521649933136520041480519643784993253;
    
    uint256 constant IC4x = 6728176676223077776278827910203808368610958464518621221506182074592805067388;
    uint256 constant IC4y = 18555313917617569697244109522319550366507637981953980987723792691792823291889;
    
    uint256 constant IC5x = 15213746696343753965682634358030093061012110709155074829983849316159958629746;
    uint256 constant IC5y = 12862520112470787839208241736348364996349771990989535399422161244710740639707;
    
    uint256 constant IC6x = 2123694168754939900345569111414036998463188468358051179135688018444433875904;
    uint256 constant IC6y = 19037040458503027991422759817227797550252966043699773451535413150618799366084;
    
    uint256 constant IC7x = 560171020866536029183507625369480517620476816131192860735740257765640086880;
    uint256 constant IC7y = 15354072737583702813420381289849288489573867315265476033370729223552917452976;
    
    uint256 constant IC8x = 19730741063606953867988692766037223994876218166458418977454568267405095535085;
    uint256 constant IC8y = 14416654382974091487953398062526714233742849468574254628873366713405223792903;
    
    uint256 constant IC9x = 2197234198654793244612745560061238162900362286662122801261807467460843065817;
    uint256 constant IC9y = 8119300085016142735256566786900985261195357139178819178632837412424882168694;
    
    uint256 constant IC10x = 3777333332904312299772927579325526808263321483697790723508288401593959216247;
    uint256 constant IC10y = 15140531516993916219067347561582669797345386500210968758693483942298650434004;
    
    uint256 constant IC11x = 11154124964511407037791473686465623885404724222755559793730758204341467527061;
    uint256 constant IC11y = 3578729744212125874797709651946106341808335114260480228583000384825705829150;
    
    uint256 constant IC12x = 4240643314118973897734937022603673874153458726099079960433507410675219304203;
    uint256 constant IC12y = 20835532543118410648930542999418928561743452688422090976696541736729949643288;
    
    uint256 constant IC13x = 7548004404142342319415427747438514045876135111666064954733988598665409350777;
    uint256 constant IC13y = 5509605991914619817258183715567529473966413181640620448276348066757019047214;
    
    uint256 constant IC14x = 15763703756901531433526824917149173806111243326615349777313303052669980724491;
    uint256 constant IC14y = 10646741752521439604316553495717167215167083398499726341333148918723187714497;
    
    uint256 constant IC15x = 4994669500509184214942763220684638393218258872841847709378539317213048955661;
    uint256 constant IC15y = 9036098719500957252054084719217013930872669061634949199263542761345562468712;
    
    uint256 constant IC16x = 9413784279385734040709835163587349535441095627733594020749911199471748854230;
    uint256 constant IC16y = 7796310941940192619640898380376759614183826590670261671630290132375237987605;
    
    uint256 constant IC17x = 3264018015556419141967035205466949551750789430050021382749657134442273348577;
    uint256 constant IC17y = 11078853683649565633818610168172079789333305124503669556658034005984780707128;
    
    uint256 constant IC18x = 1232719920460056454247739123578612836747384078199198682414076590929006708932;
    uint256 constant IC18y = 4592192247694176716418974054892274637470581368330177729186271576306022195581;
    
    uint256 constant IC19x = 16455089816979573188312211947019294882237196401794719658039142448026288597713;
    uint256 constant IC19y = 14836234820975968441270463171145618597760813438555842923277597894160118994231;
    
    uint256 constant IC20x = 8802145018498113248033139406899879241803229792609710243484583502358036305191;
    uint256 constant IC20y = 18145027516279238416389348171170155565184015796865013373548586055646723050743;
    
    uint256 constant IC21x = 13678654348570665460205425017058588785307989385616409806509430433714779879824;
    uint256 constant IC21y = 11553143819702853771953441533108839549342376461788180694361781532414369487698;
    
    uint256 constant IC22x = 9690178112905006441559752435270215767939558049645547257441915466857249441388;
    uint256 constant IC22y = 2113384049818189938940814857779069639437646687439191899193431893698994807039;
    
    uint256 constant IC23x = 14375898922004144150441980899914236585750043783428499837243516059613446562236;
    uint256 constant IC23y = 17378251423441373668357477887313906302232878352628584408715454975916033737747;
    
    uint256 constant IC24x = 1381592742470303516518423314884627135053942129151702098435286668168917196176;
    uint256 constant IC24y = 13085175765278230087794706104300926955770900863574399396491810709362057879973;
    
    uint256 constant IC25x = 10058464005452308146191303585874272020077109238671028559265116834833395173873;
    uint256 constant IC25y = 3837644608841322816214496050796430643120208449191109459139959315356774627638;
    
    uint256 constant IC26x = 2244301687091576644743316515098479857621445747540186611782297044342835872737;
    uint256 constant IC26y = 13661487943185202053066590970847326967376825958637009077601767623363221651082;
    
    uint256 constant IC27x = 20120721843526779976408854537651018803501624041237968904658369114285772036942;
    uint256 constant IC27y = 10127314468591000901582313173347426683016427014619943916329693736745997376844;
    
    uint256 constant IC28x = 7077562539219969131026957887109252515474056439883392622008214687007583439475;
    uint256 constant IC28y = 4236707508878565943582336093377648371905322637851733145577086974051618583979;
    
    uint256 constant IC29x = 592818065048372657183172836140689859210745764085379674836824380383158319658;
    uint256 constant IC29y = 19359439964717488785128221683114838213339118680702458092387984201531538137869;
    
    uint256 constant IC30x = 18634658067426373283546962672367459169167155158331025187340698013962651921933;
    uint256 constant IC30y = 16663448969297822664730230395003449111349022335344753435809410619530996445591;
    
    uint256 constant IC31x = 15619529483052613024158134746889992290147599197953354921411165175338364759739;
    uint256 constant IC31y = 20097776192390717680355887413418454034412831792728408810397365578813188056035;
    
    uint256 constant IC32x = 5473500841096432712299113028033805694388675952461092223457399087197475796233;
    uint256 constant IC32y = 16506443543390292723056814260099856517075090274981499386366133451269528520056;
    
    uint256 constant IC33x = 373543110961611961942697229733277569926447222039824872283031860532684705947;
    uint256 constant IC33y = 5393104359143349633829676973779840274924832869288423437686018827289845481805;
    
    uint256 constant IC34x = 8588702730169612432827788524134457475495632576707953016599086698695842563451;
    uint256 constant IC34y = 1462859424113795914397601809268080534413819249557567331976946927481302792465;
    
    uint256 constant IC35x = 17583147345445496722353205023899055987253469171435312452405865908554365692389;
    uint256 constant IC35y = 7825971905976679331893367007175048270795631672300864060925373477293292393444;
    
    uint256 constant IC36x = 17973592949451978245258262924342933324616289601414674316114954385338701174751;
    uint256 constant IC36y = 11673438109343932390237107742359637894656085093529881183044636020184218230128;
    
    uint256 constant IC37x = 7295558506231456502636973986986002032476368938151561627184989658628709094283;
    uint256 constant IC37y = 9778937903880103973503860613093295494979869179539692549409921092910113976096;
    
    uint256 constant IC38x = 9207777818714064063698642847755793852926937081595077604443930139961440625783;
    uint256 constant IC38y = 1170702664796637276718599304508638372540629350694672325719212715956924849887;
    
    uint256 constant IC39x = 18494340715389781894241755827526156369399527297309920842634937832623726958428;
    uint256 constant IC39y = 18811610898895372561574617440960098614431734052782794032038014353567922224531;
    
    uint256 constant IC40x = 3521776793438908013289624336997240457533488888161070986184732268697905565560;
    uint256 constant IC40y = 17966624032503665827225452662686896752162259896533476233079200079550038248327;
    
    uint256 constant IC41x = 19769569773753461153591815898474596187633108564929867819267635222333563242037;
    uint256 constant IC41y = 17729317806575644075974254649498757838494123548490160995233849613483742697638;
    
    uint256 constant IC42x = 8246871698572484273696668447183794204161370971939829301357146271133209222264;
    uint256 constant IC42y = 18250632664413874721265860985791195211136728923855525930727331996145073588180;
    
    uint256 constant IC43x = 12329049886024756753864947670103933806031778638106030041175018486219530041043;
    uint256 constant IC43y = 21806279333051149779278439876108252933514472139728484851164190061216439248893;
    
    uint256 constant IC44x = 4674243771570268790804635104868370706077879405621752850657569905110818327009;
    uint256 constant IC44y = 12563105753072599879617958840736293905205921191812679084362848473510323017686;
    
    uint256 constant IC45x = 7816138822460617075164130313521810258082529858894901756309175925526305672664;
    uint256 constant IC45y = 5597818959627820006882598439489281685055469288804516832282778779115809762772;
    
    uint256 constant IC46x = 3596929947225701161021703266327807687140566561002656474618484586606829997705;
    uint256 constant IC46y = 12089956739093125797416525928950388521223645053455255986748817181831765150950;
    
    uint256 constant IC47x = 9936670817448180346479715619049841418145533170588883697816218255571286481168;
    uint256 constant IC47y = 7416749008080127737259717805119069539477186834858596510497748472289994586062;
    
    uint256 constant IC48x = 2917194777090597010581149400499335600371931703222434084498308866304415453384;
    uint256 constant IC48y = 17568810527635546231860290607461845282425121484051609199161648196623523564028;
    
    uint256 constant IC49x = 6247347989687764534861090040187726550970899788029209125740543881123411960270;
    uint256 constant IC49y = 20843976890376814850690774723026596152501208270807603501963178974000420404433;
    
    uint256 constant IC50x = 2288657925590139989249989157359261558860898608687145079605732432090455793646;
    uint256 constant IC50y = 14900433507325773627067955647698138702988480399866814600759157569315278442953;
    
    uint256 constant IC51x = 3756244743498454917282424910632771871474866971817056993324577755000788322888;
    uint256 constant IC51y = 1751956571085943984066089875134233407557141957790004846543290278603831832089;
    
    uint256 constant IC52x = 3674863299693817285660146709942757066799867888706851490426195137823775572180;
    uint256 constant IC52y = 11679964711661895514089529926611478227763421195017703758885082032011201670831;
    
    uint256 constant IC53x = 12971443093039921391528434625933854588330289051230121295924319668302584918163;
    uint256 constant IC53y = 8184781490345866458052864901941608518691083568620606897843548771135493351001;
    
    uint256 constant IC54x = 16288250180249077749690928290846571241075121246696973535148633500244993802660;
    uint256 constant IC54y = 4349192004108591667125037539078860642863947564217630117422546174410110535296;
    
    uint256 constant IC55x = 20747371178625297383592878581975373771398135563246100687695856137003305112446;
    uint256 constant IC55y = 10653172133539386868415771789670598164959251919665304827489225832953885647241;
    
    uint256 constant IC56x = 6423134873300135817722754778814486439279869992199602488028492485697690731287;
    uint256 constant IC56y = 20075734975851101611840720545570064341609905927693976745821703483911075589562;
    
    uint256 constant IC57x = 8528511401088859562407348430550096912418568554055861880192049246241244292200;
    uint256 constant IC57y = 4582803454592782348032804268955404850000848121892630571909006612495316456915;
    
    uint256 constant IC58x = 15594076578101475626623107152101956590763861121817175844754825500250927970542;
    uint256 constant IC58y = 21332278092615295992221314450615212325491745624394970835798224401521715341655;
    
    uint256 constant IC59x = 10970488766219150542362261678988513710041603498584502022072624793191354716740;
    uint256 constant IC59y = 11670437608939856463458763684653966747347700683848488613156005644371738275142;
    
    uint256 constant IC60x = 5198561341625617459769513323958006479073504166887694992222119626558270792502;
    uint256 constant IC60y = 21203758312393161762536937069012234941667869595572283775366399149270671948080;
    
    uint256 constant IC61x = 11593661549283420617272500839457650488982995666806474764756822965326082300748;
    uint256 constant IC61y = 13596088093207197717700665900136727039937310251708402266437156515631034017296;
    
    uint256 constant IC62x = 20204582790370470351706662415377562038815263239837925631155446884147311738873;
    uint256 constant IC62y = 5680141924242913136302333639105171664017967184968864460240166402931727085923;
    
    uint256 constant IC63x = 10025710051549333143772782842077741683185530925404364502697525886818216531923;
    uint256 constant IC63y = 13624239224052902991181502745875208731353330611604135790631842417381123502717;
    
    uint256 constant IC64x = 8256506424960049416322643962159430002569788102523563731245220384231992209869;
    uint256 constant IC64y = 10557337689530879974568205090005261211849373881278236731510967376821761627635;
    
    uint256 constant IC65x = 3375459260912007100151290020301640343759512727277661181654269596976463295446;
    uint256 constant IC65y = 10290436983106619376820789373287615002499286897089069331368549957345329041602;
    
    uint256 constant IC66x = 14103864557247939767925608165578867369210902990451428493921805338639916537404;
    uint256 constant IC66y = 18656511738359468192667094566905612565678280809170088149819299864529626917240;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[66] calldata _pubSignals) public view returns (bool) {
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
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
