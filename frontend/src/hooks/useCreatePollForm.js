'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createPoll } from '@/lib/blockchain/engine/write'
import { getAddresses } from '@/lib/contracts'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { getAccount } from '@wagmi/core'
import { toast } from 'react-hot-toast'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'

/**
 * Hook to manage the poll creation form state and submission logic.
 * 
 * @returns {object} Form states, setters, and submission handler.
 */
export function useCreatePollForm() {
  const router = useRouter()
  const { isConnected } = useAccount()

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [depth, setDepth] = useState(20)
  const [options, setOptions] = useState(['', ''])
  
  // Settings
  const [isAnonymous, setIsAnonymous] = useState(true) // Semaphore
  const [isSecret, setIsSecret] = useState(false)     // ElGamal

  // Secret Key Management
  const [generatedKeys, setGeneratedKeys] = useState(null)
  const [hasSavedKey, setHasSavedKey] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clear keys when secrecy is disabled
  useEffect(() => {
    if (!isSecret) {
      setGeneratedKeys(null)
      setHasSavedKey(false)
    }
  }, [isSecret])

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault()

    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!title.trim()) {
      toast.error('Poll title is required')
      return
    }

    const cleanOptions = options.filter(o => o.trim() !== '')
    if (cleanOptions.length < 2) {
      toast.error('Need at least 2 options')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Initializing poll creation...')

    try {
      const { chainId } = getAccount(config)
      const addresses = getAddresses(chainId)

      // Map toggles to module addresses
      const eligibilityModule = isAnonymous ? addresses.semaphoreEligibility : addresses.eligibilityV0
      const voteStorage = isSecret ? addresses.zkElGamalVoteVector : addresses.voteStorageV0

      let voteStorageParams = null
      
      if (isSecret) {
         if (!generatedKeys || !hasSavedKey) {
            toast.error('Please generate and save your encryption keys', { id: toastId })
            setIsSubmitting(false)
            return
         }
         
         voteStorageParams = {
            publicKey: generatedKeys.pk
         }
      }

      const pollId = await createPoll({
        title: title.trim(),
        description: description.trim(),
        options: cleanOptions,
        merkleTreeDepth: isAnonymous ? Math.max(16, Math.min(depth, 32)) : 0,
        eligibilityModule,
        voteStorage,
        voteStorageParams
      })
      
      toast.success('Poll created!', { id: toastId })
      router.push(`/poll/${pollId}/whitelist`)
    } catch (err) {
      console.error('Failed to create poll:', err)
      toast.error(formatTransactionError(err, 'Failed to create poll'), { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    isConnected, title, description, options, isAnonymous, isSecret, 
    depth, generatedKeys, hasSavedKey, router
  ])

  return {
    title, setTitle,
    description, setDescription,
    depth, setDepth,
    options, setOptions,
    isAnonymous, setIsAnonymous,
    isSecret, setIsSecret,
    generatedKeys, setGeneratedKeys,
    hasSavedKey, setHasSavedKey,
    isSubmitting,
    handleSubmit
  }
}
