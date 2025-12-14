'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getUserNFTs } from '@/lib/blockchain/engine/read'
import NFTCard from './NFTCard'
import { motion, AnimatePresence } from 'framer-motion'

export default function NFTDashboard() {
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
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-serif font-bold mb-8 text-center border-b-2 border-black pb-4">Your Voting Badges</h2>
      {loading ? (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center text-gray-500 py-12 italic font-serif"
          >
            Loading badges...
          </motion.p>
      ) : nfts.length > 0 ? (
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <AnimatePresence>
            {nfts.map((nft) => (
              <motion.div
                key={nft.tokenId}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <NFTCard nft={nft} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-black"
        >
            <div className="text-5xl mb-4 opacity-50">📭</div>
            <h1 className="text-2xl font-serif font-bold mb-2 text-gray-900">No Badges Yet</h1>
            <p className="text-gray-600">Participate in completed polls to earn your first NFT badge!</p>
        </motion.div>
      )}
    </div>
  )
}
