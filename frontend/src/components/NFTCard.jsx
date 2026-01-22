import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NFTCard({ nft, initialExpanded = false, interactive = true }) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const isFirstMount = useRef(true)
  
  useEffect(() => {
    isFirstMount.current = false
  }, [])

  const cleanTitle = nft.description?.replace(/^Results for poll:\s*/i, '')?.replace(/^Results for\s*/i, '') || nft.description

  return (
    <div 
      onClick={() => interactive && setExpanded(!expanded)}
      className={`border-2 border-black rounded-lg p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 ${interactive ? 'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 cursor-pointer group' : ''}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className={`text-xl font-serif font-bold mb-2 ${interactive ? 'group-hover:underline underline-offset-2 decoration-2' : ''}`}>{cleanTitle}</h3>
          <p className="text-sm text-gray-400 font-mono uppercase tracking-wider">{nft.name}</p>
        </div>
        {interactive && (
          <div className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-black">
               <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
             </svg>
          </div>
        )}
      </div>
      
      <AnimatePresence initial={false}>
        {expanded && nft.attributes && (
          <motion.div
            initial={(isFirstMount.current && initialExpanded) ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-4 mt-4 border-t-2 border-black/5">
                {nft.attributes.map((attr, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-bold font-serif text-gray-500">{attr.trait_type}</span>
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{attr.value}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
