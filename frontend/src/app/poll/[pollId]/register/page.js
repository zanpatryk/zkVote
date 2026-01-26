'use client'

import { useParams } from 'next/navigation'
import { useRegistrationFlow } from '@/hooks/useRegistrationFlow'
import BackButton from '@/components/BackButton'
import { motion } from 'framer-motion'
import RegistrationInstructions from '@/components/register-poll/RegistrationInstructions'
import RegistrationSuccess from '@/components/register-poll/RegistrationSuccess'

export default function RegisterPage() {
  const { pollId } = useParams()
  
  const {
    poll,
    isRegistered,
    registeredIdentity,
    isLoading,
    isLoadingIdentity,
    isRegistering,
    error,
    handleRegister,
    downloadIdentity
  } = useRegistrationFlow(pollId)

  if (isLoading) {
    return (
      <div className="pt-32 text-center">
        <div className="animate-pulse text-xl font-serif text-gray-500">Loading poll details...</div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="pt-32 text-center text-red-500">
        {error || 'Poll not found'}
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
        <BackButton href="/poll" label="Back to Polls" className="mb-6" />
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
