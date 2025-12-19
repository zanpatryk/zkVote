'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <h1 className="text-9xl font-black font-serif text-black mb-2 tracking-tighter">404</h1>
      </motion.div>
      
      <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2 }}
         className="text-center flex flex-col items-center"
      >
        <h2 className="text-3xl font-bold font-serif text-gray-900 mb-8 uppercase tracking-widest border-b-2 border-black pb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-10 text-center max-w-md text-lg font-medium">
          The page you are looking for does not exist or has been moved.
        </p>
        
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
      </motion.div>
    </div>
  )
}
