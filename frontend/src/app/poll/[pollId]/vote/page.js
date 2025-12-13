"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { castVote } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'

export default function VoteOnPoll() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [voteTxHash, setVoteTxHash] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const pollData = await getPollById(pollId)
        if (!cancelled) setPoll(pollData)

        if (isConnected && address) {
          const voted = await hasVoted(pollId, address)
          if (!cancelled) {
            setAlreadyVoted(voted)
            if (voted) {
              const tx = await getVoteTransaction(pollId, address)
              if (!cancelled) setVoteTxHash(tx)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load poll data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [pollId, isConnected, address])



  async function handleSubmit(e) {
    e.preventDefault()

    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!poll) return



    if (alreadyVoted) {
      toast.error('You have already voted in this poll')
      return
    }

    if (selectedIndex === null) {
      toast.error('Please select an option to vote for')
      return
    }

    setSubmitting(true)
    try {
      const { voteId, txHash } = await castVote(pollId, { optionIndex: selectedIndex })
      router.push(`/poll/${pollId}/vote/receipt/${voteId}?txHash=${txHash}`)
    } catch {
      // errors already toasted in castVote
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      {loading ? (
        <p className="text-gray-600">Loading poll...</p>
      ) : !poll ? (
        <p className="text-red-600">Poll data could not be loaded.</p>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h1 className="text-4xl font-bold mb-4">{poll.title}</h1>
              {poll.description && (
                <p className="text-xl text-gray-600 max-w-2xl">{poll.description}</p>
              )}
            </div>
            <button 
              onClick={() => router.push('/poll')}
              className="text-gray-600 hover:text-black whitespace-nowrap ml-4 mt-2"
            >
              ← Go Back
            </button>
          </div>

          <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-sm">

          {poll.state !== 1 ? (
             <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    Voting is not active for this poll.
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {poll.state === 0 ? 'This poll has not started yet.' : 'This poll has ended.'}
                  </p>
                </div>
              </div>
            </div>
          ) : alreadyVoted ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">Vote Confirmed</h3>
              <p className="text-gray-600 mb-8">
                You have already cast your vote in this poll.
              </p>
              
              {voteTxHash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${voteTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black rounded-xl text-black font-medium hover:bg-black hover:text-white transition-colors"
                >
                  <span>View Transaction</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-medium mb-3">Choose your option</h3>
                {poll.options && Array.isArray(poll.options) ? (
                  <div className="space-y-2">
                    {poll.options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl cursor-pointer transition ${
                          selectedIndex === idx
                            ? 'border-black bg-gray-100'
                            : 'border-black/40 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="option"
                          value={idx}
                          checked={selectedIndex === idx}
                          onChange={() => setSelectedIndex(idx)}
                        />
                        <span className="text-lg">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No options found for this poll.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting vote...' : 'Submit vote'}
              </button>
            </form>
          )}
        </div>
        </div>
      )}
    </div>
  )
}