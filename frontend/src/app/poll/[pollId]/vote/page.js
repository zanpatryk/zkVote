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
        <p className="text-gray-600 font-serif italic text-xl text-center py-20">Loading poll...</p>
      ) : !poll ? (
        <p className="text-red-600 font-serif font-bold text-center py-20">Poll data could not be loaded.</p>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h1 className="text-5xl font-black font-serif mb-4 tracking-tight">{poll.title}</h1>
              {poll.description && (
                <p className="text-xl text-gray-600 max-w-2xl font-medium">{poll.description}</p>
              )}
            </div>
            <button 
              onClick={() => router.push('/poll')}
              className="text-gray-500 hover:text-black whitespace-nowrap ml-4 mt-2 font-medium transition-colors"
            >
              ← Go Back
            </button>
          </div>

          <div className="bg-white border-2 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">

          {poll.state !== 1 ? (
             <div className="bg-white border-2 border-black p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-black">
                     Voting is not active
                  </h3>
                  <p className="text-gray-600 font-medium">
                    {poll.state === 0 ? 'This poll has not started yet.' : 'This poll has ended.'}
                  </p>
                </div>
              </div>
            </div>
          ) : alreadyVoted ? (
            <div className="text-center py-16 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-black bg-black text-white mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-4xl font-black font-serif text-black mb-4 tracking-tight">Vote Confirmed</h3>
              <p className="text-xl text-gray-600 mb-10 font-medium max-w-md mx-auto">
                You have already cast your vote in this poll.
              </p>
              
              {voteTxHash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${voteTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-black text-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  <span>View Transaction</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h3 className="text-xl font-bold font-serif mb-4 tracking-tight">Choose your option</h3>
                {poll.options && Array.isArray(poll.options) ? (
                  <div className="space-y-3">
                    {poll.options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-4 px-6 py-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedIndex === idx
                            ? 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
                            : 'border-gray-300 hover:border-black/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="option"
                          value={idx}
                          checked={selectedIndex === idx}
                          onChange={() => setSelectedIndex(idx)}
                          className="w-5 h-5 accent-black"
                        />
                        <span className="text-lg font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 font-medium">No options found for this poll.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-y-0"
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