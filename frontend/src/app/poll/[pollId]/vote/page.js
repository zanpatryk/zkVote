"use client"

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useVoteFlow } from '@/hooks/useVoteFlow'
import { motion, AnimatePresence } from 'framer-motion'
import VoteBallot from '@/components/VoteBallot'
import BackButton from '@/components/BackButton'
import ConnectionError from '@/components/ConnectionError'

export default function VoteOnPoll() {
  const { pollId } = useParams()
  
  const {
    poll,
    alreadyVoted,
    voteTxHash,
    loadedIdentity,
    isLoading,
    isSubmitting,
    currentStep,
    steps,
    error,
    handleVoteSubmit
  } = useVoteFlow(pollId)

  const [selectedIndex, setSelectedIndex] = useState(null)

  const showBallot = alreadyVoted || (poll && poll.isZK ? loadedIdentity : true) || (poll && poll.state !== 1)

  return (
    <div className="pt-12 md:pt-24 max-w-2xl mx-auto px-6 pb-16 md:pb-32 font-mono">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.p 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-600 italic text-xl text-center py-20"
          >
            Loading ballot...
          </motion.p>
        ) : error || !poll ? (
          <ConnectionError error={error || "Poll data could not be loaded."} />
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
              <BackButton href="/poll" label="Go Back" variant="bracket" className="text-sm font-bold uppercase tracking-wider" />
            </div>

            {showBallot && (
              <VoteBallot 
                poll={poll}
                pollId={pollId}
                alreadyVoted={alreadyVoted}
                voteTxHash={voteTxHash}
                submitting={isSubmitting}
                onSubmit={(e) => {
                  e.preventDefault()
                  handleVoteSubmit(selectedIndex)
                }}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
                currentStep={currentStep}
                steps={steps}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}