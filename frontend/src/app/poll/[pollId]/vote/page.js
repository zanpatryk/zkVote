"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { Identity } from '@semaphore-protocol/identity'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

import VoteBallot from '@/components/VoteBallot'

export default function VoteOnPoll() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { castVote, isCastingVote } = useSemaphore()

  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [voteTxHash, setVoteTxHash] = useState(null)
  
  // ZK Identity State
  const [loadedIdentity, setLoadedIdentity] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const pollData = await getPollById(pollId)
        if (!cancelled) setPoll(pollData)

        if (isConnected && address) {
          // Check if this wallet has voted (public check)
          // Note: In ZK voting, preventing double voting is handled by the nullifier on-chain.
          // This check is mainly for UI state if we track "wallet X cast a vote".
          // If the contract doesn't store "who voted" (anonymous), this might return false.
          // However, we can check if the NULLIFIER for this identity has been used if we knew the identity.
          // For now, we keep the existing check but it might change for pure ZK.
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

  async function handleFileUpload(event) {
    const file = event.target.files[0]
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
    
    if (!loadedIdentity && !alreadyVoted) {
      toast.error('Please load your identity to vote')
      return
    }

    try {
      // Use ZK Vote from hook
      const result = await castVote(pollId, selectedIndex, loadedIdentity)
      
      if (result?.alreadyVoted) {
          setAlreadyVoted(true)
          return
      }

      if (result) {
        const { voteId, txHash } = result
        router.push(`/poll/${pollId}/vote/receipt/${voteId}?txHash=${txHash}`)
      }
    } catch (err) {
       console.error('Vote submission error:', err)
       // toast handled in hook
    }
  }

  const showBallot = alreadyVoted || loadedIdentity || (poll && poll.state !== 1)

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

            {!showBallot && (
               <div className="bg-white border-2 border-black p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
                  <h2 className="text-2xl font-bold font-serif">Authenticate Identity</h2>
                  <p className="text-gray-600">
                    To cast a vote, you must upload the <strong>Identity File</strong> you downloaded during registration.
                  </p>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                      id="identity-upload"
                    />
                    <label 
                      htmlFor="identity-upload"
                      className="cursor-pointer inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                    >
                      {isUploading ? 'Verifying...' : 'Upload Identity File'}
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Your private key never leaves your browser.
                  </p>
               </div>
            )}

            {showBallot && (
              <VoteBallot 
                poll={poll}
                pollId={pollId}
                alreadyVoted={alreadyVoted}
                voteTxHash={voteTxHash}
                submitting={isCastingVote}
                onSubmit={handleSubmit}
                selectedIndex={selectedIndex}
                setSelectedIndex={setSelectedIndex}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}