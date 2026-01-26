'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { usePoll } from './usePolls'
import { usePollRegistry } from './usePollRegistry'
import { useSemaphore } from './useSemaphore'
import { toast } from 'react-hot-toast'

/**
 * Hook to manage the registration flow for a specific poll.
 * 
 * @param {string} pollId - The ID of the poll.
 * @returns {object} Registration states and functions.
 */
export function useRegistrationFlow(pollId) {
  const { isConnected } = useAccount()
  const { createIdentity, register, downloadIdentity, isLoadingIdentity, isRegistering } = useSemaphore()
  
  const { poll, isLoading: isLoadingPoll, error: pollError } = usePoll(pollId)
  const { isRegistered, refetchRegistration } = usePollRegistry(pollId)
  
  const [registeredIdentity, setRegisteredIdentity] = useState(null)

  const handleRegister = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      // Create deterministic identity for this poll
      const identity = await createIdentity(pollId)
      if (identity) {
        const success = await register(pollId, identity)
        
        if (success) {
          refetchRegistration()
          setRegisteredIdentity(identity)
        }
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const msg = err?.message || err?.shortMessage || 'Registration failed'
      toast.error(msg.length > 50 ? msg.slice(0, 50) + '...' : msg)
    }
  }

  return {
    poll,
    pollId,
    isConnected,
    isRegistered,
    registeredIdentity,
    isLoading: isLoadingPoll,
    isLoadingIdentity,
    isRegistering,
    error: pollError,
    handleRegister,
    downloadIdentity
  }
}
