'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useReadContract } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { getPollById } from '@/lib/blockchain/engine/read'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import SemaphoreEligibilityModuleABI from '@/lib/contracts/abis/SemaphoreEligibilityModule.json'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function RegisterPage({ params }) {
  const router = useRouter()
  const { pollId } = use(params)
  const { address, isConnected } = useAccount()
  const { createIdentity, register, downloadIdentity, isLoadingIdentity, isRegistering } = useSemaphore()
  
  const [poll, setPoll] = useState(null)
  const [loadingPoll, setLoadingPoll] = useState(true)
  const [registeredIdentity, setRegisteredIdentity] = useState(null) // New state for just-registered users

  // 1. Get Eligibility Module Address
  const { data: eligibilityModuleAddress } = useReadContract({
    address: votingSystemContract.address,
    abi: votingSystemContract.abi,
    functionName: 's_eligibilityModule',
  })

  // 2. Check registration status
  const { data: isRegistered, refetch: refetchRegistration } = useReadContract({
    address: eligibilityModuleAddress,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'isRegistered',
    args: [BigInt(pollId), address],
    query: { enabled: !!eligibilityModuleAddress && !!address }
  })

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
      const identity = await createIdentity()
      if (identity) {
        // Manual download flow: Don't download automatically
        // downloadIdentity(identity, pollId)
        
        await register(pollId, identity)
        refetchRegistration()
        
        setRegisteredIdentity(identity) // Save for manual download
        toast.success('Successfully registered! Please safely store your identity.')
      }
    } catch (err) {
      console.error('Registration failed:', err)
      const msg = err?.message || err?.shortMessage || 'Registration failed'
      // truncation for toast readability
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
        <Link href={`/poll/${pollId}`}>
          <button className="text-gray-600 hover:text-black font-medium transition mb-6 flex items-center gap-2">
            ← Back to Poll
          </button>
        </Link>
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

        {registeredIdentity ? (
          <div className="text-center py-8">
             <div className="text-black text-5xl mb-4">✓</div>
             <h3 className="text-2xl font-bold mb-2">Registration Successful!</h3>
             <p className="text-gray-600 mb-6 max-w-md mx-auto">
               Your ZK Identity has been generated. <br/>
               <span className="font-bold underline decoration-2 underline-offset-2">You must download and save it to vote.</span>
             </p>
             
             <div className="flex flex-col gap-4 w-full">
               <button 
                 onClick={() => downloadIdentity(registeredIdentity, pollId)}
                 className="bg-black text-white px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all w-full flex items-center justify-center gap-2"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5L12 15m0 0l4.5-4.5M12 15V3" />
                 </svg>
                 Download Identity
               </button>
               
               <Link href={`/poll/${pollId}/vote`}>
                 <button className="bg-white border-2 border-black text-black px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all w-full">
                   Proceed to Voting →
                 </button>
               </Link>
             </div>
          </div>
        ) : isRegistered ? (
          <div className="text-center py-8">
            <div className="text-black text-5xl mb-4">✓</div>
            <h3 className="text-2xl font-bold mb-2">You are registered!</h3>
            <p className="text-gray-600 mb-8">You can now cast your anonymous vote.</p>
            <div className="flex flex-col gap-4 w-full">
               <Link href={`/poll/${pollId}/vote`}>
                  <button className="bg-black text-white px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all w-full">
                    Go to Voting
                  </button>
               </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded border border-gray-200">
                <h4 className="font-bold mb-2">How it works:</h4>
                <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2">
                    <li>We will ask you to sign a message to generate your secret identity.</li>
                    <li>We generate a Zero-Knowledge Proof commitment.</li>
                    <li>This commitment is added to the smart contract.</li>
                    <li>When you vote, you prove you possess the secret without revealing it.</li>
                </ul>
            </div>

            <button
              onClick={handleRegister}
              disabled={isLoadingIdentity || isRegistering}
              className="w-full bg-black text-white py-4 rounded-lg text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoadingIdentity ? 'Generating Identity...' : isRegistering ? 'Registering on Chain...' : 'Create Identity & Register'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
