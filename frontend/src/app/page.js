"use client"

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { getUserNFTs } from '@/lib/blockchain/engine/read'

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
    <div className="flex flex-col items-center min-h-screen pt-24 px-6">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-6">zkVote</h1>
        <p className="text-2xl text-gray-600">Decentralized Voting System</p>
      </div>

      {isConnected && (
        <div className="w-full max-w-5xl">
          <h2 className="text-3xl font-bold mb-8 text-center border-b pb-4">Your Voting Badges</h2>
          
          {loading ? (
             <p className="text-center text-gray-500">Loading badges...</p>
          ) : nfts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <div key={nft.tokenId} className="border border-black rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
                  <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{nft.description}</p>
                  
                  {nft.attributes && (
                    <div className="space-y-2">
                       {nft.attributes.map((attr, idx) => (
                         <div key={idx} className="flex justify-between text-sm">
                           <span className="font-semibold">{attr.trait_type}:</span>
                           <span>{attr.value}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">You haven't earned any badges yet. Participate in polls to earn them!</p>
          )}
        </div>
      )}
    </div>
  )
}