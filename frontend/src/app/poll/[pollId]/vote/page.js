"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, hasVoted } from '@/lib/blockchain/read'
import { castVote } from '@/lib/blockchain/write'
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

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const pollData = await getPollById(pollId)
        if (!cancelled) setPoll(pollData)

        if (isConnected && address) {
          const voted = await hasVoted(pollId, address)
          if (!cancelled) setAlreadyVoted(voted)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [pollId, isConnected, address])

  const now = Date.now()
  const startTime = poll?.startTime ? Number(poll.startTime) : null
  const endTime = poll?.endTime ? Number(poll.endTime) : null
  const isActive = startTime && endTime && now >= startTime && now < endTime

  async function handleSubmit(e) {
    e.preventDefault()

    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!poll) return

    if (!isActive) {
      toast.error('This poll is not currently open for voting')
      return
    }

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
      const voteId = await castVote(pollId, { optionIndex: selectedIndex })
      router.push(`/poll/${pollId}/vote/receipt/${voteId}`)
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
        <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">{poll.title}</h2>
            {poll.description && (
              <p className="text-gray-700">{poll.description}</p>
            )}
          </div>

          {alreadyVoted ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have already voted in this poll.
                  </p>
                </div>
              </div>
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
                disabled={submitting || !isActive}
                className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {isActive ? (submitting ? 'Submitting vote...' : 'Submit vote') : 'Poll not open for voting'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}