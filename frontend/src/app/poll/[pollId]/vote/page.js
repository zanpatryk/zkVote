"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { castVote } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

import VoteBallot from '@/components/VoteBallot'

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
    <div className="pt-12 md:pt-24 max-w-2xl mx-auto px-6 pb-16 md:pb-32 font-mono">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.p 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-600 italic text-xl text-center py-20"
          >
            Loading ballot...
          </motion.p>
        ) : !poll ? (
          <motion.p 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 font-bold text-center py-20"
          >
            Poll data could not be loaded.
          </motion.p>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
                 <span className="text-sm uppercase tracking-widest text-gray-500 font-bold">Secure Voting Terminal</span>
               </div>
              <button 
                onClick={() => router.push('/poll')}
                className="text-gray-500 hover:text-black whitespace-nowrap text-sm font-bold uppercase tracking-wider hover:underline"
              >
                [ Go Back ]
              </button>
            </div>

            <VoteBallot 
              poll={poll}
              pollId={pollId}
              alreadyVoted={alreadyVoted}
              voteTxHash={voteTxHash}
              submitting={submitting}
              onSubmit={handleSubmit}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}