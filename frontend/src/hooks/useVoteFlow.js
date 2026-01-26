'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useSemaphore } from './useSemaphore'
import { useZKVote } from './useZKVote'
import { usePollRegistry } from './usePollRegistry'
import { usePoll } from './usePolls'
import { hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { useIdentityTransfer } from '@/lib/providers/IdentityTransferContext'
import { toast } from 'react-hot-toast'

/**
 * Hook to manage the complete voting flow for a specific poll.
 * 
 * @param {string} pollId - The ID of the poll.
 * @returns {object} Voting states and handler functions.
 */
export function useVoteFlow(pollId) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { isLoadingIdentity } = useSemaphore()
  const { consumeIdentity } = useIdentityTransfer()
  const { submitVote, isSubmitting, currentStep, steps } = useZKVote(pollId)
  const { isZK, isRegistered } = usePollRegistry(pollId)
  const { poll, isLoading: isLoadingPoll, error: pollError } = usePoll(pollId)

  const [alreadyVoted, setAlreadyVoted] = useState(false)
  const [voteTxHash, setVoteTxHash] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadError, setLoadError] = useState(null)
  
  // ZK Identity State
  const [loadedIdentity, setLoadedIdentity] = useState(null)

  // 1. Initial Data Loading (Vote Status)
  useEffect(() => {
    let cancelled = false

    async function checkVoteStatus() {
      if (!isConnected || !address || !pollId) {
        setLoadingStatus(false)
        return
      }

      try {
        setLoadingStatus(true)
        const { data: voted, error: voteError } = await hasVoted(pollId, address)
        if (voteError) throw new Error(voteError)
        
        if (!cancelled) {
          setAlreadyVoted(voted)
          if (voted) {
            const { data: tx } = await getVoteTransaction(pollId, address)
            if (!cancelled) setVoteTxHash(tx)
          }
        }
      } catch (error) {
        console.error('Failed to load vote status:', error)
        if (!cancelled) setLoadError(error.message || 'Failed to check vote status')
      } finally {
        if (!cancelled) setLoadingStatus(false)
      }
    }

    // Check for transient identity passed from Upload Page or Auth Page
    if (consumeIdentity && !loadedIdentity) {
       const pendingIdentity = consumeIdentity(pollId)
       if (pendingIdentity) {
          setLoadedIdentity(pendingIdentity)
          toast.success('Identity loaded')
       }
    }
        
    checkVoteStatus()

    return () => {
      cancelled = true
    }
  }, [pollId, isConnected, address, consumeIdentity, loadedIdentity])

  // 2. Strict Redirect Logic
  useEffect(() => {
    const isLoadingAny = isLoadingPoll || loadingStatus || isLoadingIdentity
    if (!isLoadingAny && isZK && !alreadyVoted && !loadedIdentity) {
       // Short timeout to avoid flash if identity is being set
       const timer = setTimeout(() => {
         if (!loadedIdentity) {
             toast.error('Please authenticate to vote')
             router.replace(`/poll/${pollId}/auth`)
         }
       }, 500)
       return () => clearTimeout(timer)
    }
  }, [isLoadingPoll, loadingStatus, isZK, alreadyVoted, loadedIdentity, router, pollId, isLoadingIdentity])

  // 3. Consolidated Submit Handler
  const handleVoteSubmit = useCallback(async (selectedIndex) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!poll) return

    if (selectedIndex === null) {
      toast.error('Please select an option to vote for')
      return
    }
    
    if (isZK) {
      if (!isRegistered && !loadedIdentity && !alreadyVoted) {
         toast.error('You are not registered for this poll')
         return
      }
      
      if (!loadedIdentity && !alreadyVoted) {
         toast.error('Please load your identity to vote')
         return
      }
    }

    try {
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
       // toast handled in useZKVote hook
    }
  }, [poll, pollId, isConnected, isZK, isRegistered, loadedIdentity, alreadyVoted, submitVote, router])

  return {
    poll,
    pollId,
    alreadyVoted,
    voteTxHash,
    loadedIdentity,
    isLoading: isLoadingPoll || loadingStatus,
    isSubmitting,
    currentStep,
    steps,
    error: pollError || loadError,
    handleVoteSubmit
  }
}
