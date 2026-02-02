'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import BackButton from '@/components/BackButton'

import { useIdentityTransfer } from '@/lib/providers/IdentityTransferContext'

import IdentityFileUploader from '@/components/IdentityFileUploader'

export default function VoteUploadPage() {
  const router = useRouter()
  const { setIdentity } = useIdentityTransfer()
  
  const handleIdentityParsed = async ({ identity, pollId }) => {
    // 4. Store in RAM Context (Transient)
    setIdentity(identity, pollId)
    
    toast.success('Identity loaded! Redirecting...')
    
    // 5. Redirect to Vote Page
    setTimeout(() => {
      router.push(`/poll/${pollId}/vote`)
    }, 1000)
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <BackButton href="/vote" label="Back to Voting" className="mb-6" />
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Vote with Identity File</h1>
        <p className="text-lg text-gray-600">
          Upload your saved identity JSON file to vote on a poll. This allows you to vote anonymously, as the wallet address you use to cast the vote can be different from the one that was whitelisted.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <IdentityFileUploader onIdentityParsed={handleIdentityParsed} />
      </motion.div>
    </div>
  )
}
