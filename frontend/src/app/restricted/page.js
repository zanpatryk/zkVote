'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function RestrictedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <motion.div
           initial={{ scale: 0.8, rotate: -10 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: "spring", stiffness: 200, damping: 15 }}
           className="text-8xl mb-8 block"
        >
          🔒
        </motion.div>
        
        <h1 className="text-6xl font-black font-serif text-black mb-6 tracking-tight">Restricted Access</h1>
        <p className="text-xl text-gray-600 mb-10 font-medium">
          You need to connect your wallet to view this page. Please connect using the button in the navbar to continue.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href="/" 
              className="px-8 py-4 bg-black text-white text-lg font-bold rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all inline-block"
            >
              Return to Landing Page
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
