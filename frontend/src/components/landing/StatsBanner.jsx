"use client"
import { motion } from 'framer-motion'

export default function StatsBanner() {
  const content = [
    "ZERO KNOWLEDGE PROTOCOLS",
    "HOMOMORPHIC ENCRYPTION",
    "ON-CHAIN VERIFICATION",
    "NULLIFIER ANONYMITY",
    "SEMAPHORE V4",
    "CLIENT-SIDE PROOF GENERATION"
  ]

  return (
    <div className="w-screen bg-black text-white overflow-hidden py-6 border-y-2 border-black flex whitespace-nowrap">
      <div className="relative flex whitespace-nowrap">
        {/* We render the list twice to create a seamless loop */}
        <motion.div
           className="flex items-center gap-12 px-6 flex-shrink-0"
           animate={{ x: "-100%" }}
           transition={{ 
             duration: 50, // Adjust speed here
             repeat: Infinity, 
             ease: "linear" 
           }}
        >
          {content.map((item, i) => (
             <div key={i} className="flex items-center gap-12">
                <span className="text-xl font-mono font-bold tracking-widest uppercase">{item}</span>
                <span className="text-gray-600">●</span>
             </div>
          ))}
        </motion.div>
        
        {/* Duplicate for loop */}
        <motion.div
           className="flex items-center gap-12 px-6 flex-shrink-0"
           animate={{ x: "-100%" }}
           transition={{ 
             duration: 50, 
             repeat: Infinity, 
             ease: "linear" 
           }}
        >
          {content.map((item, i) => (
             <div key={i} className="flex items-center gap-12">
                <span className="text-xl font-mono font-bold tracking-widest uppercase">{item}</span>
                <span className="text-gray-600">●</span>
             </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
