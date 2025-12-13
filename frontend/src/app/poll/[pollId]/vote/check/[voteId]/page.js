'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'

export default function VoteCheckPage() {
  const { pollId, voteId } = useParams()
  const [vote, setVote] = useState(null)
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [voteData, pollData] = await Promise.all([
          getVote(voteId),
          getPollById(pollId)
        ])

        if (!voteData) {
          setError('Vote not found or could not be loaded.')
        } else {
          setVote(voteData)
        }

        if (pollData) {
          setPoll(pollData)
        }
      } catch (err) {
        console.error('Failed to load details:', err)
        setError('Failed to load details.')
      } finally {
        setLoading(false)
      }
    }

    if (pollId && voteId) {
      loadData()
    }
  }, [pollId, voteId])

  const optionText = vote && poll && poll.options && poll.options[Number(vote.optionIdx)]
    ? poll.options[Number(vote.optionIdx)]
    : 'Unknown Option'

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <h1 className="text-4xl font-bold mb-8">Vote Details</h1>

      {loading ? (
        <p className="text-gray-600">Loading data...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-1">Poll ID</h2>
            <p className="text-sm font-mono break-all">{pollId}</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-1">Vote ID</h2>
            <p className="text-sm font-mono break-all">{voteId}</p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-500 mb-2">Selected Option</h2>
            <p className="text-3xl font-bold">{optionText}</p>
          </div>

          {vote.timestamp && (
            <div className="pt-4">
              <h2 className="text-sm font-semibold text-gray-500 mb-1">Timestamp</h2>
              <p className="text-gray-800">{new Date(Number(vote.timestamp) * 1000).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
