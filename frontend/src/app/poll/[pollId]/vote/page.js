"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { useZKVote } from '@/hooks/useZKVote' // Uses usePollRegistry internally but we need it here too
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { Identity } from '@semaphore-protocol/identity'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

import VoteBallot from '@/components/VoteBallot'
import BackButton from '@/components/BackButton'


import ConnectionError from '@/components/ConnectionError'
import { useIdentityTransfer } from '@/lib/providers/IdentityTransferContext'

export default function VoteOnPoll() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { createIdentity, isLoadingIdentity } = useSemaphore()
  const { consumeIdentity } = useIdentityTransfer()
  const { submitVote, isSubmitting, currentStep, steps } = useZKVote(pollId)
  const { isZK, isRegistered } = usePollRegistry(pollId)

  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [voteTxHash, setVoteTxHash] = useState(null)
  
  const [loadError, setLoadError] = useState(null)
  
  // ZK Identity State
  const [loadedIdentity, setLoadedIdentity] = useState(null)
  const [isUploading, setIsUploading] = useState(false)


  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const { data: pollData, error: pollError } = await getPollById(pollId)
        if (pollError) throw new Error(pollError)
        if (!cancelled) setPoll(pollData)

        if (isConnected && address) {
          const { data: voted, error: voteError } = await hasVoted(pollId, address)
          if (voteError) throw new Error(voteError)
          
          if (!cancelled) {
            setAlreadyVoted(voted)
            if (voted) {
              const { data: tx } = await getVoteTransaction(pollId, address)
              if (!cancelled) setVoteTxHash(tx)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load poll data:', error)
        if (!cancelled) setLoadError(error.message || 'Failed to load poll data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Check for transient identity passed from Upload Page or Auth Page
    if (consumeIdentity && !loadedIdentity) {
       const pendingIdentity = consumeIdentity(pollId)
       if (pendingIdentity) {
          setLoadedIdentity(pendingIdentity)
          toast.success('Identity loaded')
       } else if (isZK && !alreadyVoted && !loadedIdentity) {
          // If ZK poll, no identity loaded, and haven't voted -> Redirect to Auth
          // (Wait a tick to let alreadyVoted load potentially, but we do this inside useEffect after loadData finishes normally? 
          // Actually loadData is async. We should probably do this check AFTER loadData sets state.)
       }
    }
    
    // We'll handle the strict redirect in a separate effect dependent on loading state
    
    loadData()

    return () => {
      cancelled = true
    }
  }, [pollId, isConnected, address, consumeIdentity])

  // Strict Redirect Effect
  useEffect(() => {
    if (!loading && isZK && !alreadyVoted && !loadedIdentity && !isLoadingIdentity) {
       // Short timeout to avoid flash if identity is being set
       const timer = setTimeout(() => {
         if (!loadedIdentity) {
             toast.error('Please authenticate to vote')
             router.replace(`/poll/${pollId}/auth`)
         }
       }, 500)
       return () => clearTimeout(timer)
    }
  }, [loading, isZK, alreadyVoted, loadedIdentity, router, pollId, isLoadingIdentity])



  /* Removed late declaration */

  // Redirect or warn if not registered for ZK polls?
  // For now, we'll just check in handle submit or let the UI handle it.
  
  async function handleSubmit(e) {
    e.preventDefault()

    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!poll) return

    if (selectedIndex === null) {
      toast.error('Please select an option to vote for')
      return
    }
    
    // Identity only needed for ZK
    // Identity only needed for ZK
    if (isZK) {
      // If NOT registered and NO identity loaded, block
      // (If identity IS loaded, we assume valid proof can be generated regardless of wallet)
      if (!isRegistered && !loadedIdentity && !alreadyVoted) {
         toast.error('You are not registered for this poll')
         return
      }
      
      if (!loadedIdentity && !alreadyVoted && !isRegistered) {
        // Redundant with above but specific messaging for clarity
        toast.error('You are not registered for this poll')
        return
      }

      if (!loadedIdentity && !alreadyVoted) {
         // If registered but no identity, they likely need to generate it (if that was supported inline) 
         // OR they are expected to have it. 
         // For now, if they are registered, we might want to prompt them to load or generate? 
         // But the existing logic just said "Please load". 
         // Let's stick to: if you have identity, you pass. If you are registered, you still need identity to vote in ZK poll.
         toast.error('Please load your identity to vote')
         return
      }
    }

    try {
      // Use Unified ZK/Secret Vote from hook
      const result = await submitVote(selectedIndex, loadedIdentity)
      
      if (result?.alreadyVoted) {
          setAlreadyVoted(true)
          return
      }

      if (result) {
        const { voteId, txHash, nullifier, proof } = result
        const proofStr = proof ? encodeURIComponent(JSON.stringify(proof)) : ''
        router.push(`/poll/${pollId}/vote/receipt/${voteId}?txHash=${txHash}&nullifier=${nullifier || ''}&proof=${proofStr}`)
      }
    } catch (err) {
       console.error('Vote submission error:', err)
       // toast handled in hook
    }
  }

  const showBallot = alreadyVoted || (isZK ? loadedIdentity : true) || (poll && poll.state !== 1)

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
        ) : !poll || loadError ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 border-2 border-red-200 bg-red-50 rounded-xl"
          >
            <div className="text-red-500 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
             {(loadError && loadError.toString().toLowerCase().includes('network')) && (
                <h3 className="text-xl font-bold text-red-800 mb-2">Connection Error</h3>
             )}
             <p className="text-red-600 font-bold text-lg mb-4">
               {loadError && loadError.toString().toLowerCase().includes('network')
                 ? 'Could not connect to the network. Please make sure you are on the correct chain.'
                 : (loadError || "Poll data could not be loaded.")}
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="text-sm underline text-red-800 hover:text-black font-semibold"
             >
               Try Again
             </button>
          </motion.div>
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
                onSubmit={handleSubmit}
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