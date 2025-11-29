'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'

export default function HomePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('check') // 'check' | 'badges'

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
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32">
      {/* Tab Switcher */}
      <div className="flex space-x-4 mb-12">
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
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-sm text-left">
          <h2 className="text-2xl font-semibold mb-3">Check your vote</h2>
          <p className="text-gray-600 mb-4">
            Upload a vote receipt file (.txt) to view its details again.
          </p>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            aria-label="Upload vote receipt"
            className="w-full text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-black hover:file:bg-gray-300"
          />
        </div>
      )}

      {/* NFT Badges Section */}
      {activeTab === 'badges' && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <h1 className="text-4xl font-bold mb-4 text-gray-400">NFT Badges</h1>
          <p className="text-xl text-gray-500">Coming soon</p>
        </div>
      )}
    </div>
  )
}