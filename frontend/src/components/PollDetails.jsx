"use client"

import { useEffect, useState } from 'react'
import { getPollById, getPollResults } from '@/lib/blockchain/engine/read'
import { motion, AnimatePresence } from 'framer-motion'

export default function PollDetails({ pollId, showResults = false }) {
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (!pollId) return
      
      try {
        const pollData = await getPollById(pollId)
        if (cancelled) return
        setPoll(pollData)

        if (showResults && pollData && pollData.options) {
             const res = await getPollResults(pollId, pollData.options.length)
             if (!cancelled) setResults(res)
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
  }, [pollId, showResults])

  if (loading) {
    return <p className="text-gray-600">Loading poll data...</p>
  }

  if (!poll) {
    return <p className="text-red-600">Poll data could not be loaded.</p>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-2 border-black p-6 md:p-8 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative font-sans"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-b-2 border-dashed border-gray-200 pb-6 mb-6"
      >
        <p className="text-xs font-mono text-gray-500 uppercase mb-2">Poll Title</p>
        <h2 className="text-3xl font-bold leading-tight">{poll.title}</h2>
      </motion.div>

      <div className="space-y-6">
         {/* Description */}
        {poll.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs font-mono text-gray-500 uppercase mb-2">Description</p>
            <p className="text-gray-800 leading-relaxed">{poll.description}</p>
          </motion.div>
        )}

        {/* Options */}
        {poll.options && Array.isArray(poll.options) && (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.4 }
              }
            }}
            className="pt-6 border-t border-dashed border-gray-200"
          >
             <p className="text-xs font-mono text-gray-500 uppercase mb-4">Options</p>
            <ul className="space-y-3">
              {(() => {
                 const votes = results.map(r => Number(r || 0))
                 const maxVotes = Math.max(...votes, 0)
                 // Only highlight if there are votes
                 const hasVotes = maxVotes > 0

                 return poll.options.map((opt, idx) => {
                   const voteCount = Number(results[idx] || 0)
                   const isWinner = showResults && hasVotes && voteCount === maxVotes

                   return (
                    <motion.li 
                      key={idx} 
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0 }
                      }}
                      className="flex justify-between items-stretch group"
                    >
                      <span className={`font-medium text-lg px-3 py-2 flex-grow rounded-l-lg border-y-2 border-l-2 transition flex items-center gap-2 ${
                        isWinner 
                          ? 'bg-black text-white border-black font-black' 
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}>
                        {opt}
                      </span>
                      {showResults && results[idx] !== undefined && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 + (idx * 0.1) }}
                          className={`font-mono font-bold px-4 py-2 rounded-r-lg border-2 min-w-[4rem] text-center text-lg flex items-center justify-center ${
                             isWinner
                               ? 'bg-white text-black border-black'
                               : 'bg-gray-100 text-gray-400 border-gray-100'
                          }`}
                        >
                          {Number(results[idx])}
                        </motion.span>
                      )}
                    </motion.li>
                   )
                 })
              })()}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
