"use client"
import { motion } from 'framer-motion'

export default function CTASection() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="w-full max-w-5xl text-center border-2 border-black p-16 bg-black text-white"
    >
      <h2 className="text-4xl font-black font-serif mb-6 tracking-tight">Ready to Vote?</h2>
      <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
        Join the future of decentralized governance. Connect your wallet to get started.
      </p>
      <div className="inline-block px-8 py-4 border-2 border-white text-lg font-bold uppercase tracking-wider">
        Connect Wallet Above ↑
      </div>
    </motion.div>
  )
}
