'use client'

import VoteChecker from '@/components/VoteChecker'
import { motion } from 'framer-motion'

export default function VerifyPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-32 max-w-3xl mx-auto px-6 pb-32 text-center"
    >
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-5xl font-serif font-bold text-gray-900 mb-6"
      >
        Verify Your Vote
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl text-gray-600 mb-16 font-light max-w-2xl mx-auto"
      >
        Upload your vote receipt file to audit your vote on the blockchain.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <VoteChecker />
      </motion.div>
    </motion.div>
  )
}
