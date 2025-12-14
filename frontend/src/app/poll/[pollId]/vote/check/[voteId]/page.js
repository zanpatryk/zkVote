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
    
  // Determine action button based on poll state
  const isActive = poll?.state === 1
  const isEnded = poll?.state === 2

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 font-mono text-left">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black font-serif tracking-tight">Vote Details</h1>
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-500 hover:text-black whitespace-nowrap font-medium transition-colors"
        >
          ← Go Back
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600 font-serif italic text-xl text-center py-20">Loading data...</p>
      ) : error ? (
        <p className="text-red-600 font-serif font-bold text-center py-20">{error}</p>
      ) : (
        <div className="bg-white p-8 max-w-md mx-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative mb-12">
          
           {/* Receipt Header */}
           <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
            <h2 className="text-3xl font-black font-serif tracking-tight uppercase">zkVote</h2>
            <p className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-widest">Verified Record</p>
           </div>

          <div className="space-y-4 mb-8">
            <div>
              <p className="text-xs text-gray-500 uppercase">Poll ID</p>
              <Link href={`/poll/${pollId}`} className="text-sm break-all hover:underline hover:text-black transition-colors block">
                {pollId}
              </Link>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 uppercase">Vote ID</p>
              <p className="text-sm break-all">{voteId}</p>
            </div>

            {txHash && (
              <div>
                <p className="text-xs text-gray-500 uppercase">Transaction Hash</p>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-black break-all underline decoration-dotted underline-offset-2 transition-colors block"
                >
                  {txHash}
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-dashed border-gray-200">
               <p className="text-xs text-gray-500 uppercase mb-1">Selected Option</p>
               <p className="text-xl font-bold font-sans">{optionText}</p>
            </div>

            {vote.timestamp && (
              <div>
                 <p className="text-xs text-gray-500 uppercase mt-4">Timestamp</p>
                 <p className="text-gray-800 text-sm">{new Date(Number(vote.timestamp) * 1000).toLocaleString()}</p>
              </div>
            )}
          </div>
          
           {/* Action Button */}
           <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-300 text-center font-sans space-y-4">
              {isActive ? (
                <button
                  onClick={() => router.push(`/poll/${pollId}`)}
                  className="w-full bg-black text-white px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  View Active Poll
                </button>
              ) : isEnded ? (
                 <button
                  onClick={() => router.push(`/poll/${pollId}/nft`)}
                  className="w-full bg-black text-white px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  View Results & Mint NFT
                </button>
              ) : (
                 <button
                  onClick={() => router.push(`/poll/${pollId}`)}
                  className="w-full bg-white text-black px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  Return to Poll
                </button>
              )}
           </div>
        </div>
      )}
    </div>
  )
}
