'use client'

import { useWhitelistedAddresses } from '@/hooks/useWhitelistedAddresses'
import { motion, AnimatePresence } from 'framer-motion'

export default function WhitelistedAddressesList({ pollId }) {
  const { 
    addresses, 
    loading, 
    hasMore, 
    loadMore, 
    lastScannedBlock 
  } = useWhitelistedAddresses(pollId)

  const addressList = Array.from(addresses)

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-black font-serif mb-6 flex items-center gap-4">
        Whitelisted Addresses
        <span className="text-sm bg-black text-white px-3 py-1 rounded-full font-mono">
          {addressList.length}
        </span>
      </h2>

      <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {addressList.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500 italic">
                No addresses whitelisted yet in the scanned range.
            </div>
        ) : (
            <div className="divide-y-2 divide-black max-h-[400px] overflow-y-auto">
                <AnimatePresence initial={false}>
                    {addressList.map((addr, index) => (
                        <motion.div 
                            key={addr} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 font-mono text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {addr}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
        
        {/* Footer / Pagination */}
        <div className="p-4 border-t-2 border-black bg-gray-50 flex justify-between items-center">
            <div className="text-xs text-gray-500 font-mono">
                Scanned until block: {lastScannedBlock?.toString() || '...'}
            </div>
            
            {hasMore && (
                <button 
                  onClick={() => loadMore()} 
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white text-sm font-bold rounded hover:bg-gray-800 disabled:opacity-50 transition"
                >
                    {loading ? 'Scanning...' : 'Load More History'}
                </button>
            )}
        </div>
      </div>
    </div>
  )
}
