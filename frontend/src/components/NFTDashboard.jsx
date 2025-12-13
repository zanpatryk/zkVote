'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getUserNFTs } from '@/lib/blockchain/engine/read'
import NFTCard from './NFTCard'

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
      <h2 className="text-3xl font-bold mb-8 text-center border-b pb-4">Your Voting Badges</h2>
      {loading ? (
          <p className="text-center text-gray-500 py-12">Loading badges...</p>
      ) : nfts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nfts.map((nft) => (
            <NFTCard key={nft.tokenId} nft={nft} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <h1 className="text-2xl font-bold mb-4 text-gray-400">No Badges Yet</h1>
            <p className="text-gray-500">Participate in polls to earn your first badge!</p>
        </div>
      )}
    </div>
  )
}
