"use client"
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion'
import PollCard from '@/components/PollCard'
import VoteBallot from '@/components/VoteBallot'
import ReceiptCard from '@/components/ReceiptCard'
import NFTCard from '@/components/NFTCard'
import PollBasicInfo from '@/components/create-poll/PollBasicInfo'
import PollSettings from '@/components/create-poll/PollSettings'
import OptionsEditor from '@/components/create-poll/OptionsEditor'
import WhitelistManager from '@/components/WhitelistManager'
import TallyManager from '@/components/TallyManager'
import RegistrationInstructions from '@/components/register-poll/RegistrationInstructions'

// Demo Data Constants
const demoPoll = {
  pollId: BigInt('0x1a2b3c4d5e6f7890'),
  title: "Community Treasury Allocation Q1 2025",
  state: 1, // Active
}

const demoReceipt = {
  "pollId": "8",
  "voteId": "6",
  "txHash": "0x2726c9a60dc27f493bd1cf4560cb4281d99a6e1a305a3a86791111c13d70f815",
  "nullifier": "3034132140369062456853654697868216062301940130123208959878314996879286511975",
  "proof": "{\"a\":[\"4772145300969548532230620281705027138191769623784625197310982031901113306220\",\"978199520531611565904594883886810867477640643903616916547323219617092668330\"],\"b\":[[\"6810796168890859922001717171171340149325584473079585371251852130642197495444\",\"6608944144639779068854516191084365117410352558978481477224527878993548750662\"],[\"9754436909371604352763144885724643016867497782910034345780487219453928922246\",\"2238917804187023433325682164689382070726450725784370628242825949796688319212\"]],\"c\":[\"2168393567063417838512520701818000975261551844841787532295035440487639203131\",\"708072992146460273813472053128843902176883718589137210467470917241022476354\"]}",
  "timestamp": 1768665910038
}

const demoNFT = {
  tokenId: "42",
  name: "Governance Participant Badge",
  description: "Results for poll: Community Treasury Allocation",
  attributes: [
    { trait_type: "Poll Name", value: "Treasury Allocation" },
    { trait_type: "Total Votes", value: "156" },
    { trait_type: "Winning Option", value: "Fund development" },
    { trait_type: "Support Level", value: "62.8%" },
    { trait_type: "Privacy", value: "ZK-Protected" }
  ]
}

// Demo Ballot Wrapper
function DemoBallotWrapper() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  
  const demoBallotData = {
    title: "Should we implement Quadratic Voting?",
    description: "Quadratic voting allows users to express preference intensity.",
    options: ["Yes, implement it", "No, keep 1-person-1-vote"],
    state: 1
  }

  return (
    <div className="w-full max-w-lg mx-auto transform scale-90 md:scale-100 origin-top bg-white">
      <VoteBallot 
        poll={demoBallotData}
        pollId="0x123...abc"
        alreadyVoted={false}
        submitting={false}
        onSubmit={(e) => e.preventDefault()}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />
    </div>
  )
}

// Demo Poll Creation Form using real components
function DemoPollCreationForm() {
  const [title, setTitle] = useState("Community Treasury Allocation")
  const [description, setDescription] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [isSecret, setIsSecret] = useState(true)
  const [options, setOptions] = useState(["Fund development", "Marketing & growth"])

  return (
    <div className="bg-white border-2 border-black px-6 pt-8 pb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-[360px] overflow-hidden h-[700px] flex flex-col items-center">
      <div className="transform scale-[0.76] origin-top w-[410px]">
        <PollBasicInfo 
          title={title} 
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          showDescription={true}
          compact={true}
        />
        <PollSettings
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          isSecret={isSecret}
          setIsSecret={setIsSecret}
          onOptionsLimitChange={() => {}}
          vertical={true}
        />
        
        {/* Simplified Options for space */}
        <div className="mb-6">
          <label className="block text-xl font-serif font-bold text-gray-900 mb-3">Voting Options</label>
          <div className="space-y-4">
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={() => {}}
                className="w-full px-5 py-3 border-2 border-black rounded-lg text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all focus:bg-gray-50 outline-none"
                placeholder={`Option ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <button className="w-full mt-6 bg-black text-white py-6 rounded-lg text-2xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
          Launch Poll
        </button>
      </div>
    </div>
  )
}

// Journey Step Component
function JourneyStep({ number, title, description, children, reverse = false, active = false, direction = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: active ? 1 : 0, 
        pointerEvents: active ? 'auto' : 'none',
        display: active ? 'flex' : 'none'
      }}
      transition={{ duration: 0.6, ease: "circOut" }}
      className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className={`flex items-start gap-6 ${reverse ? 'lg:order-2' : ''}`}>
          <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            {number}
          </div>
          <div className="pt-1 text-left">
            <h3 className="text-3xl font-bold font-serif mb-4 tracking-tight">{title}</h3>
            <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className={`flex justify-center items-center ${reverse ? 'lg:order-1' : ''}`}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}



export default function ExperienceShowcase() {
  const [activeTab, setActiveTab] = useState('creator')
  const containerRef = useRef(null)
  const prevIndexRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for down, -1 for up

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Smooth out the scroll progress to prevent jumping too many steps
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Calculate active index based on scroll progress
  const totalSteps = activeTab === 'creator' ? 5 : 6

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    const index = Math.min(
      Math.floor(latest * totalSteps),
      totalSteps - 1
    )
    
    if (index !== activeIndex) {
      setDirection(index > activeIndex ? 1 : -1)
      setActiveIndex(index)
      prevIndexRef.current = index
    }
  })

  // Reset index when switching tabs
  useEffect(() => {
    setActiveIndex(0)
    setDirection(1)
    prevIndexRef.current = 0
  }, [activeTab])

  return (
    <div ref={containerRef} className="w-full relative h-[1200vh]">
      {/* Sticky Display Area - Adjusted for Navbar height (64px/4rem) */}
      <div className="sticky top-16 h-[calc(100vh-64px)] w-full flex items-center justify-center overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
        
        <div className="w-full h-full relative">
          {/* Step 0: Intro & Switcher */}
          <motion.section 
            animate={{ 
              opacity: activeIndex === 0 ? 1 : 0,
              pointerEvents: activeIndex === 0 ? 'auto' : 'none',
              display: activeIndex === 0 ? 'flex' : 'none'
            }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          >
            <motion.h2 className="text-6xl font-black font-serif mb-6 tracking-tighter">
              Experience the Platform
            </motion.h2>
            <motion.p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
              Explore how zkVote secures governance through our interactive journeys. Choose your persona below and scroll to begin.
            </motion.p>

            {/* Tab Buttons */}
            <div className="flex justify-center gap-6">
              <motion.button
                onClick={() => setActiveTab('creator')}
                animate={{
                  backgroundColor: activeTab === 'creator' ? '#000000' : '#ffffff',
                  color: activeTab === 'creator' ? '#ffffff' : '#000000',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="group relative px-10 py-5 font-bold uppercase tracking-widest text-xs border-2 border-black"
              >
                I Want to Create a Poll
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('voter')}
                animate={{
                  backgroundColor: activeTab === 'voter' ? '#000000' : '#ffffff',
                  color: activeTab === 'voter' ? '#ffffff' : '#000000',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="group relative px-10 py-5 font-bold uppercase tracking-widest text-xs border-2 border-black"
              >
                I Want to Vote
              </motion.button>
            </div>

            {/* Hint */}
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-16 flex flex-col items-center text-gray-400 font-mono text-[10px] uppercase tracking-[0.3em]"
            >
              <span className="mb-2">Scroll to Start Journey</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.section>

          {/* Journey Steps */}
          {activeTab === 'creator' ? (
            <>
              <JourneyStep
                active={activeIndex === 1}
                direction={direction}
                number="1"
                title="Create Your Poll"
                description="Set up your governance proposal with a title, description, and voting options. Enable Anonymity for ZK-protected voter identities, and Secrecy for encrypted ballots."
              >
                <DemoPollCreationForm />
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 2}
                direction={direction}
                number="2"
                title="Whitelist Eligible Voters"
                description="Control who can participate by adding wallet addresses to your whitelist. Batch add participants with CSV uploads or add them individually."
                reverse
              >
                <WhitelistManager demo={true} />
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 3}
                direction={direction}
                number="3"
                title="Monitor Live Voting"
                description="Track registrations and encrypted votes in real-time. For secret polls, individual participation stays private until the final decryption phase."
              >
                <PollCard 
                  pollId={demoPoll.pollId}
                  title={demoPoll.title}
                  state={demoPoll.state}
                  isOwner={true}
                  showVoteButton={false}
                  interactive={false}
                />
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 4}
                direction={direction}
                number="4"
                title="Decrypt & Publish Results"
                description="When voting ends, use your secret key to decrypt the results. Our homomorphic tallying ensures only the final count is ever revealed."
                reverse
              >
                <TallyManager demo={true} />
              </JourneyStep>
            </>
          ) : (
            <>
              <JourneyStep
                active={activeIndex === 1}
                direction={direction}
                number="1"
                title="Browse Available Polls"
                description="Discover polls you're whitelisted for. Real-time status indicators show which proposals are open for registration or active voting."
              >
                <PollCard 
                  pollId={demoPoll.pollId}
                  title={demoPoll.title}
                  state={demoPoll.state}
                  isOwner={false}
                  showVoteButton={true}
                  interactive={false}
                />
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 2}
                direction={direction}
                number="2"
                title="Register Your ZK Identity"
                description="For anonymous polls, generate a unique ZK commitment. This one-time process ensures your vote cannot be linked back to your wallet address."
                reverse
              >
                <RegistrationInstructions demo={true} />
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 3}
                direction={direction}
                number="3"
                title="Cast Your Encrypted Vote"
                description="Your ballot is encrypted using ElGamal homomorphic encryption. This ensures your choices remain completely private from both the public and poll creators."
              >
                <DemoBallotWrapper />
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 4}
                direction={direction}
                number="4"
                title="Verify Your Vote"
                description="Receive a cryptographic receipt with your nullifier hash. Use it to verify that your specific vote was correctly included in the final on-chain tally."
                reverse
              >
                <div className="w-full max-w-2xl transform scale-90 md:scale-100 origin-top">
                  <ReceiptCard 
                    pollId={demoReceipt.pollId}
                    voteId={demoReceipt.voteId}
                    txHash={demoReceipt.txHash}
                    nullifier={demoReceipt.nullifier}
                    proof={demoReceipt.proof}
                    interactive={false}
                  />
                </div>
              </JourneyStep>

              <JourneyStep
                active={activeIndex === 5}
                direction={direction}
                number="5"
                title="Collect NFT Badge"
                description="After the poll ends, mint a commemorative NFT badge. This serves as permanent, on-chain proof of your participation in governance."
              >
                <NFTCard nft={demoNFT} initialExpanded={true} interactive={true} />
              </JourneyStep>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

