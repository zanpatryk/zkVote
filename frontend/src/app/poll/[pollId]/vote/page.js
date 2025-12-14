"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { castVote } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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

            <motion.div 
              layout
              className="bg-white border-2 border-black p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
            >
              {/* Poll Header (Title and Description) */}
              <div className="border-b-2 border-dashed border-gray-300 pb-6 mb-8 text-center">
                 <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">{poll.title}</h1>
                 {poll.description && (
                  <p className="text-sm text-gray-600 max-w-lg mx-auto italic leading-relaxed">
                    {poll.description}
                  </p>
                 )}
                 <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-4">Poll ID #{pollId}</p>
              </div>

              {poll.state !== 1 ? (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-gray-100 border-2 border-dashed border-gray-400 p-6 text-center"
                >
                  <p className="font-bold text-lg uppercase mb-2">Voting Closed</p>
                  <p className="text-sm text-gray-600">
                    {poll.state === 0 ? 'This poll has not started yet.' : 'This poll has ended.'}
                  </p>
                </motion.div>
              ) : alreadyVoted ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 border-2 border-black bg-gray-50"
                >
                  <div className="inline-block border-2 border-black rounded-full p-4 mb-4 bg-white">
                     <span className="text-4xl">🗳️</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase mb-2">Vote Cast</h3>
                  <p className="text-sm text-gray-600 mb-6 uppercase tracking-wide">You have already voted.</p>
                  
                  {voteTxHash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${voteTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
                    >
                      View Receipt
                    </a>
                  )}
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <motion.div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold border-b border-gray-200 pb-2">Select One Option</p>
                    {poll.options && Array.isArray(poll.options) ? (
                      <div className="space-y-4">
                        {poll.options.map((opt, idx) => (
                          <motion.label
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05, duration: 0.3 }}
                            className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all hover:bg-gray-50 group border-black bg-white hover:translate-x-1`}
                          >
                            <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                               selectedIndex === idx ? 'border-black bg-black' : 'border-black bg-white'
                            }`}>
                               {selectedIndex === idx && <div className="w-2 h-2 bg-white"></div>}
                            </div>
                            <span className={`text-lg font-bold uppercase tracking-wide ${selectedIndex === idx ? 'underline decoration-2 underline-offset-4' : ''}`}>{opt}</span>
                            <input
                              type="radio"
                              name="option"
                              value={idx}
                              checked={selectedIndex === idx}
                              onChange={() => setSelectedIndex(idx)}
                              className="sr-only"
                            />
                          </motion.label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600">No options found.</p>
                    )}
                  </motion.div>

                  <div className="pt-6 border-t-2 border-dashed border-gray-300">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-black text-white py-5 text-xl font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Authenticating...' : 'Cast Vote'}
                    </motion.button>
                    <p className="text-[10px] uppercase text-center mt-3 text-gray-400">
                        By voting, you agree to sign a transaction on the blockchain.
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}