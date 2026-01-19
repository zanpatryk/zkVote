'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createPoll } from '@/lib/blockchain/engine/write'
import { MODULE_ADDRESSES } from '@/lib/contracts'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'

// Modular Components
import PollBasicInfo from '@/components/create-poll/PollBasicInfo'
import PollSettings from '@/components/create-poll/PollSettings'
import KeyGenerator from '@/components/create-poll/KeyGenerator'
import VoterCapacity from '@/components/create-poll/VoterCapacity'
import OptionsEditor from '@/components/create-poll/OptionsEditor'

export default function CreatePollPage() {
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isConnected) return toast.error('Please connect your wallet first')

    const cleanOptions = options.filter(o => o.trim() !== '')
    if (cleanOptions.length < 2) return toast.error('Need at least 2 options')
    if (isSecret && cleanOptions.length > 16) return toast.error('Encrypted polls are limited to 16 options')
    if (!title.trim()) return toast.error('Poll title is required')

    setIsSubmitting(true)

    try {
      // map toggles to module addresses
      const eligibilityModule = isAnonymous ? MODULE_ADDRESSES.semaphoreEligibility : MODULE_ADDRESSES.eligibilityV0
      const voteStorage = isSecret ? MODULE_ADDRESSES.zkElGamalVoteVector : MODULE_ADDRESSES.voteStorageV0

      let voteStorageParams = null
      
      if (isSecret) {
         if (!generatedKeys || !hasSavedKey) {
            return toast.error('Please generate and save your encryption keys')
         }
         
         // Use the real generated Public Key
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
      
      // Redirect to the new whitelist page for the created poll
      router.push(`/poll/${pollId}/whitelist`)
    } catch (err) {
      console.error('Failed to create poll:', err)
      // Error toast is handled by functionality in write.js
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex justify-between items-center"
      >
        <div>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Create New Poll</h1>
          <p className="text-lg text-gray-600">Launch a secure, tamper-proof vote.</p>
        </div>
        <BackButton href="/poll" label="Back to Dashboard" />
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        
        <PollBasicInfo 
          title={title} 
          setTitle={setTitle} 
          description={description} 
          setDescription={setDescription} 
        />

        <PollSettings
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          isSecret={isSecret}
          setIsSecret={setIsSecret}
          onOptionsLimitChange={() => {
             // If turning ON secrecy loop calls this, but we handle truncation here just in case logic is needed
             if (options.length > 16) setOptions(options.slice(0, 16))
          }}
        />

        <AnimatePresence>
          {isSecret && (
            <KeyGenerator
              generatedKeys={generatedKeys}
              setGeneratedKeys={setGeneratedKeys}
              hasSavedKey={hasSavedKey}
              setHasSavedKey={setHasSavedKey}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnonymous && (
            <VoterCapacity depth={depth} setDepth={setDepth} />
          )}
        </AnimatePresence>

        <OptionsEditor
          options={options}
          setOptions={setOptions}
          isSecret={isSecret}
        />

        {/* Submit */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t-2 border-black/5"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-5 rounded-lg text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Poll...' : 'Launch Poll'}
          </motion.button>
        </motion.div>
      </form>
    </div>
  )
}