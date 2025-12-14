"use client"
import WhitelistManager from '@/components/WhitelistManager'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function WhitelistPage() {
  const { pollId } = useParams()
  const router = useRouter()

  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-black font-serif mb-4 tracking-tight">Whitelist Voters</h1>
        <p className="text-xl text-gray-600 font-medium">Add wallet addresses that are authorized to vote on this poll.</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <WhitelistManager 
          pollId={pollId} 
        />
      </motion.div>
    </div>
  )
}