'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { getUserNFTs } from '@/lib/blockchain/engine/read'
import NFTCard from './NFTCard'
import ConnectionError from './ConnectionError'
import { motion, AnimatePresence } from 'framer-motion'

export default function NFTDashboard() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchBadges() {
      if (!isConnected || !address) return
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await getUserNFTs(address)
      
      if (fetchError) {
        setError(fetchError)
      } else {
        setNfts(data)
      }
      
      setLoading(false)
    }

    fetchBadges()
  }, [address, isConnected, chainId])

  const filteredNfts = nfts.filter(nft => 
      (nft.pollId && nft.pollId.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
      (nft.name && nft.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Poll ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-black focus:border-black outline-none transition bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none placeholder-gray-400 font-medium"
          />
      </div>

      {error ? (
        <ConnectionError error={error} />
      ) : loading ? (
          <div className="text-center py-20 text-xl text-gray-600 font-serif italic">
            Loading badges...
          </div>
      ) : filteredNfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Column 1 (Even indices) */}
          <div className="space-y-8">
            <AnimatePresence>
              {filteredNfts.filter((_, i) => i % 2 === 0).map((nft) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <NFTCard nft={nft} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Column 2 (Odd indices) */}
          <div className="space-y-8">
            <AnimatePresence>
              {filteredNfts.filter((_, i) => i % 2 !== 0).map((nft) => (
                <motion.div
                  key={nft.tokenId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <NFTCard nft={nft} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-24 border-2 border-dashed border-gray-300 rounded-xl"
        >
            <p className="text-xl text-gray-400 font-serif italic">
               {nfts.length === 0 ? "Participate in completed polls to earn your first NFT badge!" : "No results found. Try a different search term."}
            </p>
        </motion.div>
      )}
    </div>
  )
}
