'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getUserNFTs } from '@/lib/blockchain/engine/read'

export default function HomePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('check') // 'check' | 'badges'
  const [nfts, setNfts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchBadges() {
      if (!isConnected || !address || activeTab !== 'badges') return
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
  }, [address, isConnected, activeTab])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()

    // Expect lines like: "Poll ID: X" and "Vote ID: Y"
    const pollMatch = text.match(/Poll ID:\s*((?:0x)?[0-9a-fA-F]+)/i)
    const voteMatch = text.match(/Vote ID:\s*((?:0x)?[0-9a-fA-F]+)/i)

    if (!pollMatch || !voteMatch) {
      alert('Could not read poll and vote IDs from this receipt file.')
      return
    }

    const pollId = pollMatch[1]
    const voteId = voteMatch[1]

    router.push(`/poll/${pollId}/vote/check/${voteId}`)
  }

  return (
    <div className="pt-32 max-w-5xl mx-auto px-6 pb-32">
      {/* Tab Switcher */}
      <div className="flex space-x-4 mb-12 max-w-3xl mx-auto">
        <button
          onClick={() => setActiveTab('check')}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${
            activeTab === 'check'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Check Vote
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${
            activeTab === 'badges'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          NFT Badges
        </button>
      </div>

      {/* Check Vote Section */}
      {activeTab === 'check' && (
        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-sm text-left max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-3">Check your vote</h2>
          <p className="text-gray-600 mb-6">
            Upload a vote receipt file (.txt) to view its details again.
          </p>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            aria-label="Upload vote receipt"
            className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 cursor-pointer"
          />
        </div>
      )}

      {/* NFT Badges Section */}
      {activeTab === 'badges' && (
        <div className="w-full">
          {loading ? (
             <p className="text-center text-gray-500 py-12">Loading badges...</p>
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
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
               <h1 className="text-2xl font-bold mb-4 text-gray-400">No Badges Yet</h1>
               <p className="text-gray-500">Participate in polls to earn your first badge!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}