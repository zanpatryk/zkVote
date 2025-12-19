"use client"

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { getUserNFTs } from '@/lib/blockchain/engine/read'
import PollCard from '@/components/PollCard'
import VoteBallot from '@/components/VoteBallot'
import ReceiptCard from '@/components/ReceiptCard'
import NFTCard from '@/components/NFTCard'
import { motion } from 'framer-motion'

// Demo data for showcase
const demoPoll = {
  pollId: BigInt('0x1a2b3c4d5e6f7890'),
  title: "Community Treasury Allocation Q1 2025",
  state: 1, // Active
}

const demoReceipt = {
  pollId: "0x7f3a8b1c9d2e4f50",
  voteId: "0x9e8d7c6b5a4f3e21",
  txHash: "0xabc123def456789012345678901234567890abcdef123456789012345678901234"
}

const demoNFT = {
  tokenId: "1",
  name: "Genesis Voter Badge",
  description: "Awarded for participating in the first zkVote governance proposal",
  attributes: [
    { trait_type: "Poll", value: "Genesis Proposal" },
    { trait_type: "Date", value: "Dec 2024" },
    { trait_type: "Rarity", value: "Legendary" }
  ]
}

function DemoBallotWrapper() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  
  const demoBallotData = {
    title: "Should we implement Quadratic Voting?",
    description: "Quadratic voting allows users to express the intensity of their preferences, not just direction.",
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

export default function LandingPage() {
  const { address, isConnected } = useAccount()
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchBadges() {
      if (!isConnected || !address) return
      setLoading(true)
      try {
        const data = await getUserNFTs(address)
        setNfts(data)
      } catch (error) {
        console.error("Failed to fetch badges", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [address, isConnected])

  return (
    <div className="flex flex-col items-center pt-32 px-6 pb-32">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-24"
      >
        <div className="inline-block mb-6 px-4 py-2 border-2 border-black text-sm font-bold uppercase tracking-widest">
          Decentralized Governance
        </div>
        <h1 className="text-8xl md:text-9xl font-black font-serif mb-8 tracking-tight">zkVote</h1>
        <p className="text-2xl md:text-3xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed">
          Secure, transparent, and verifiable voting on the blockchain.
        </p>
        {!isConnected && (
          <p className="text-lg text-gray-500 mt-8 max-w-xl mx-auto">
            Connect your wallet to create polls, cast votes, and earn commemorative NFT badges.
          </p>
        )}
      </motion.div>

      {!isConnected && (
        <>
          {/* Stats Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-5xl mb-24"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-2 border-black p-8 bg-black text-white">
              <div className="text-center">
                <p className="text-5xl font-black font-serif">100%</p>
                <p className="text-sm uppercase tracking-widest mt-2 text-gray-400">On-Chain</p>
              </div>
              <div className="text-center border-y py-8 md:py-0 md:border-y-0 md:border-l md:border-r border-white/20">
                <p className="text-5xl font-black font-serif">ZK</p>
                <p className="text-sm uppercase tracking-widest mt-2 text-gray-400">Privacy</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-black font-serif">NFT</p>
                <p className="text-sm uppercase tracking-widest mt-2 text-gray-400">Badges</p>
              </div>
            </div>
          </motion.div>

          {/* Experience Section */}
          <div className="w-full max-w-6xl mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-black font-serif mb-4 text-center tracking-tight"
            >
              Experience the Platform
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto"
            >
              See what zkVote looks like from the inside. Real components, real experience.
            </motion.p>
            
            {/* Poll Card Showcase */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0">1</div>
                <div>
                  <h3 className="text-2xl font-bold font-serif mb-2">View & Manage Polls</h3>
                  <p className="text-gray-600 text-lg">Browse active governance proposals and track their status. Create new polls, manage whitelists, and monitor voting progress in real-time.</p>
                </div>
              </div>
              <div>
                <PollCard 
                  pollId={demoPoll.pollId}
                  title={demoPoll.title}
                  state={demoPoll.state}
                  isOwner={false}
                  showVoteButton={true}
                />
              </div>
            </motion.div>

            {/* Vote Ballot Showcase */}
            <motion.div 
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="flex items-start gap-4 lg:order-2">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0">2</div>
                <div>
                  <h3 className="text-2xl font-bold font-serif mb-2">Cast Your Vote</h3>
                  <p className="text-gray-600 text-lg">Experience a sleek, official ballot interface. Your vote is anonymized using Zero-Knowledge proofs before it ever hits the chain.</p>
                </div>
              </div>
              <div className="lg:order-1 flex justify-center">
                 <DemoBallotWrapper />
              </div>
            </motion.div>

            {/* Receipt Card Showcase */}
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0">3</div>
                <div>
                  <h3 className="text-2xl font-bold font-serif mb-2">Get Vote Receipts</h3>
                  <p className="text-gray-600 text-lg">Every vote generates a downloadable receipt with poll ID, vote ID, and transaction hash. Use these IDs to independently verify your vote on the blockchain.</p>
                </div>
              </div>
              <div className="flex justify-center lg:justify-start">
                <ReceiptCard 
                  pollId={demoReceipt.pollId}
                  voteId={demoReceipt.voteId}
                  txHash={demoReceipt.txHash}
                  interactive={false}
                />
              </div>
            </motion.div>

            {/* NFT Card Showcase */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="flex items-start gap-4 lg:order-2">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl flex-shrink-0">4</div>
                <div>
                  <h3 className="text-2xl font-bold font-serif mb-2">Collect NFT Badges</h3>
                  <p className="text-gray-600 text-lg">Earn unique commemorative badges for each vote you cast. Build your collection of governance participation proof and display your voting history.</p>
                </div>
              </div>
              <div className="flex justify-center lg:order-1 lg:justify-end">
                <NFTCard nft={demoNFT} />
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <div className="w-full max-w-5xl mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-black font-serif mb-12 text-center tracking-tight"
            >
              How It Works
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Connect", desc: "Link your wallet to access the platform" },
                { step: "02", title: "Create or Vote", desc: "Start a poll or participate in governance" },
                { step: "03", title: "Verify", desc: "Check any vote on the blockchain" },
                { step: "04", title: "Collect", desc: "Mint your participation NFT badge" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border-2 border-black p-6 bg-white"
                >
                  <div className="text-4xl font-black font-serif mb-4">{item.step}</div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-5xl text-center border-2 border-black p-16 bg-black text-white"
          >
            <h2 className="text-4xl font-black font-serif mb-6 tracking-tight">Ready to Vote?</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
              Join the future of decentralized governance. Connect your wallet to get started.
            </p>
            <div className="inline-block px-8 py-4 border-2 border-white text-lg font-bold uppercase tracking-wider">
              Connect Wallet Above ↑
            </div>
          </motion.div>
        </>
      )}

      {isConnected && (
        <div className="w-full max-w-5xl">
          <h2 className="text-4xl font-black font-serif mb-10 text-center border-b-2 border-black pb-6 tracking-tight">Your Voting Badges</h2>
          
          {loading ? (
             <p className="text-center text-gray-600 font-serif italic text-xl py-20">Loading badges...</p>
          ) : nfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {nfts.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 border-2 border-dashed border-gray-300">
              <p className="text-xl text-gray-500 font-serif italic">You haven't earned any badges yet. Participate in polls to earn them!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}