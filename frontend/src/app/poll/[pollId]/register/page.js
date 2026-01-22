'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import BackButton from '@/components/BackButton'
import { getPollById } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import RegistrationInstructions from '@/components/register-poll/RegistrationInstructions'
import RegistrationSuccess from '@/components/register-poll/RegistrationSuccess'

export default function RegisterPage() {
  const router = useRouter()
  const { pollId } = useParams()
  const { isConnected } = useAccount()
  const { createIdentity, register, downloadIdentity, isLoadingIdentity, isRegistering } = useSemaphore()
  
  const [poll, setPoll] = useState(null)
  const [loadingPoll, setLoadingPoll] = useState(true)
  const [registeredIdentity, setRegisteredIdentity] = useState(null) // New state for just-registered users

  // 1. Get Poll Registry Info
  const { isRegistered, refetchRegistration } = usePollRegistry(pollId)

  useEffect(() => {
    if (!pollId) return
    
    getPollById(pollId).then(data => {
      setPoll(data)
      setLoadingPoll(false)
    }).catch(err => {
      console.error('Failed to load poll:', err)
      toast.error('Failed to load poll details')
      setLoadingPoll(false)
    })
  }, [pollId])

  const handleRegister = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      // Create deterministic identity for this poll (can be regenerated anytime)
      const identity = await createIdentity(pollId)
      if (identity) {
        const success = await register(pollId, identity)
        
        if (success) {
          refetchRegistration()
          setRegisteredIdentity(identity)
          toast.success('Successfully registered! You can regenerate your identity anytime by signing.')
        }
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const msg = err?.message || err?.shortMessage || 'Registration failed'
      toast.error(msg.length > 50 ? msg.slice(0, 50) + '...' : msg)
    }
  }

  if (loadingPoll) {
    return (
      <div className="pt-32 text-center">
        <div className="animate-pulse text-xl font-serif text-gray-500">Loading poll details...</div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="pt-32 text-center text-red-500">
        Poll not found
      </div>
    )
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <BackButton href={`/poll/${pollId}`} label="Back to Poll" className="mb-6" />
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Register for Anonymous Voting</h1>
        <p className="text-lg text-gray-600">
          This poll requires ZK Identity registration. By registering, you create a private identity that allows you to vote without revealing your wallet address.
        </p>
      </motion.div>

      <div className="bg-white border-2 border-black p-8 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">Poll: {poll.title}</h2>
            <p className="text-gray-500 text-sm">ID: {pollId}</p>
        </div>

        {registeredIdentity || isRegistered ? (
          <RegistrationSuccess
            pollId={pollId}
            registeredIdentity={registeredIdentity}
            isJustRegistered={!!registeredIdentity}
            onDownload={downloadIdentity}
          />
        ) : (
          <RegistrationInstructions
            onRegister={handleRegister}
            isLoading={isLoadingIdentity}
            isRegistering={isRegistering}
          />
        )}
      </div>
    </div>
  )
}
