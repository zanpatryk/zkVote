'use client'

import NFTDashboard from '@/components/NFTDashboard'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-32 max-w-5xl mx-auto px-6 pb-32 space-y-16"
    >
      
      {/* NFT Badges Section */}
      <NFTDashboard />
    </motion.div>
  )
}