'use client'

import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import BackButton from '@/components/BackButton'

import { useIdentityTransfer } from '@/lib/providers/IdentityTransferContext'
import { useSemaphore } from '@/hooks/useSemaphore'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import IdentityFileUploader from '@/components/IdentityFileUploader'

export default function PollAuthPage() {
  const router = useRouter()
  const { pollId } = useParams()
  const { address, isConnected } = useAccount()
  const { setIdentity } = useIdentityTransfer()
  
  // Reuse existing hooks
  const { createIdentity, isLoadingIdentity } = useSemaphore()
  const { isZK, isLoading: isRegistryLoading } = usePollRegistry(pollId)

  // Auto-redirect if poll is not anonymous (ZK)
  useEffect(() => {
    if (!isRegistryLoading && !isZK) {
        router.replace(`/poll/${pollId}/vote`)
    }
  }, [isZK, isRegistryLoading, router, pollId])

  if (isRegistryLoading || !isZK) {
      return null
  }

  const handleSign = async () => {
    if (!isConnected) {
        toast.error('Connect wallet first')
        return
    }
    
    const identity = await createIdentity(pollId)
    if (identity) {
        setIdentity(identity, pollId)
        toast.success('Authenticated! Redirecting...')
        router.push(`/poll/${pollId}/vote`)
    }
  }

  // OPTION 2: Upload File Handler
  const handleIdentityParsed = async ({ identity, pollId: filePollId }) => {
    // 1. Validate Poll ID Context
    if (filePollId && String(filePollId) !== String(pollId)) {
        toast.error(`Identity file is for Poll #${filePollId}, but you are authenticating for Poll #${pollId}`)
        return
    }

    // 2. Store & Redirect
    setIdentity(identity, pollId)
    toast.success('Identity loaded! Redirecting...')
    router.push(`/poll/${pollId}/vote`)
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <BackButton href={`/poll/${pollId}`} label="Back to Poll Details" className="mb-6" />
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Authenticate to Vote</h1>
        <p className="text-lg text-gray-600">
          Poll #{pollId} requires secure identity verification. You can sign with your registered wallet or upload a backup identity.
        </p>
      </motion.div>

      <div className="grid gap-8">
        
        {/* Option 1: Wallet */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white border-2 border-black p-8 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Sign with Wallet
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
                If you registered with your currently connected wallet ({address?.slice(0,6)}...{address?.slice(-4)}), just sign a message to generate your proof.
            </p>
            <button 
                onClick={handleSign}
                disabled={isLoadingIdentity || !isConnected}
                className="w-full bg-black text-white px-6 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {isLoadingIdentity ? (
                    'Signing...'
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Sign & Enter
                    </>
                )}
            </button>
        </motion.div>

        <div className="flex items-center gap-4 text-gray-400">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="font-mono text-sm uppercase">OR</span>
            <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Option 2: Upload */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
        >
            <IdentityFileUploader onIdentityParsed={handleIdentityParsed} />
            
             <p className="text-center text-xs text-gray-400 mt-4 max-w-sm mx-auto">
                Use this if you are voting from a different browser or wallet than the one you registered with.
             </p>
        </motion.div>

      </div>
    </div>
  )
}
