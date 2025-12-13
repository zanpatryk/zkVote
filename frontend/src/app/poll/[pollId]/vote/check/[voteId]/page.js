'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'

export default function VoteCheckPage() {
  const router = useRouter()
  const { pollId, voteId } = useParams()
  const searchParams = useSearchParams()
  const txHash = searchParams.get('txHash')

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Vote Details</h1>
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-600 hover:text-black whitespace-nowrap"
        >
          ← Go Back
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading data...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-1">Poll ID</h2>
            <Link href={`/poll/${pollId}`} className="text-sm font-mono break-all hover:underline hover:text-black transition-colors block">
              {pollId}
            </Link>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-500 mb-1">Vote ID</h2>
            <p className="text-sm font-mono break-all">{voteId}</p>
          </div>

          {txHash && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-1">Transaction Hash</h2>
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono break-all text-gray-600 hover:text-black underline decoration-dotted underline-offset-2 transition-colors block"
              >
                {txHash}
              </a>
            </div>
          )}

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
