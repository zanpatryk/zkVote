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
import IdentityAuthenticator from '@/components/vote-poll/IdentityAuthenticator'
import ConnectionError from '@/components/ConnectionError'

export default function VoteOnPoll() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { createIdentity, isLoadingIdentity } = useSemaphore()
  const { submitVote, isSubmitting, currentStep, steps } = useZKVote(pollId)

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

    loadData()

    return () => {
      cancelled = true
    }
  }, [pollId, isConnected, address])

  /**
   * Regenerate identity from wallet signature (primary method)
   */
  async function handleRegenerateIdentity() {
    const identity = await createIdentity(pollId)
    if (identity) {
      setLoadedIdentity(identity)
      toast.success('Identity loaded from wallet!')
    }
  }


  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      
      // Try to find the private key in standard Semaphore export formats
      const privateKey = json.privateKey || json._privateKey || json.secret
      
      if (!privateKey) {
        throw new Error('Invalid identity file: Missing private key')
      }

      // Reconstruct Identity
      const identity = new Identity(privateKey)
      
      setLoadedIdentity(identity)
      toast.success('Identity loaded successfully!')
    } catch (error) {
      console.error('Failed to load identity:', error)
      toast.error('Invalid identity file')
    } finally {
      setIsUploading(false)
    }
  }

  const { isZK, isRegistered } = usePollRegistry(pollId)

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
    if (isZK) {
      if (!isRegistered) {
         toast.error('You are not registered for this poll')
         return
      }
      if (!loadedIdentity && !alreadyVoted) {
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

            {!showBallot && (
               <IdentityAuthenticator 
                 onRegenerateIdentity={handleRegenerateIdentity}
                 onFileUpload={handleFileUpload}
                 isLoading={isLoadingIdentity}
                 isUploading={isUploading}
               />
            )}


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