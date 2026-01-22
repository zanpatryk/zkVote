'use client'

import NFTDashboard from '@/components/NFTDashboard'
import { motion } from 'framer-motion'

export default function NFTsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-32 max-w-5xl mx-auto px-6 pb-32"
    >
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">My NFT Badges</h1>
        <p className="text-gray-500 text-lg">Collection of your governance participation proofs.</p>
      </div>
      
      {/* NFT Badges Section */}
      <NFTDashboard />
    </motion.div>
  )
}
