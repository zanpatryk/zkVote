'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { POLL_STATE } from '@/lib/constants'
import { useExplorer } from '@/hooks/useExplorer'

export default function VoteBallot({ 
  poll, 
  pollId, 
  alreadyVoted, 
  voteTxHash, 
  submitting, 
  onSubmit, 
  selectedIndex, 
  setSelectedIndex,
  currentStep = 0,
  steps = []
}) {
  const { getTxUrl } = useExplorer()

  if (!poll) return null

  return (
    <motion.div 
      layout
      className="bg-white border-2 border-black p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative"
    >
      {/* Poll Header (Title and Description) */}
      <div className="border-b-2 border-dashed border-gray-300 pb-6 mb-8 text-center">
         <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">{poll.title}</h1>
         {poll.description && (
          <p className="text-sm text-gray-600 max-w-lg mx-auto italic leading-relaxed">
            {poll.description}
          </p>
         )}
         <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-4">Poll ID #{pollId}</p>
      </div>

      {poll.state !== POLL_STATE.ACTIVE ? (
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-gray-100 border-2 border-dashed border-gray-400 p-6 text-center"
        >
          <p className="font-bold text-lg uppercase mb-2">Voting Closed</p>
          <p className="text-sm text-gray-600">
            {poll.state === POLL_STATE.CREATED ? 'This poll has not started yet.' : 'This poll has ended.'}
          </p>
        </motion.div>
      ) : alreadyVoted ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 border-2 border-black bg-gray-50"
        >
          <h3 className="text-2xl font-black uppercase mb-2">Vote Cast</h3>
          <p className="text-sm text-gray-600 mb-6 uppercase tracking-wide">You have already voted.</p>
          
          {voteTxHash && (
            <a 
              href={getTxUrl(voteTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-black text-white font-bold uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
            >
              View Receipt
            </a>
          )}
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-8">
          <motion.div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-bold border-b border-gray-200 pb-2">Select One Option</p>
            {poll.options && Array.isArray(poll.options) ? (
              <div className="space-y-4">
                {poll.options.map((opt, idx) => (
                  <motion.label
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all hover:bg-gray-50 group border-black bg-white hover:translate-x-1`}
                  >
                    <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                       selectedIndex === idx ? 'border-black bg-black' : 'border-black bg-white'
                    }`}>
                       {selectedIndex === idx && <div className="w-2 h-2 bg-white"></div>}
                    </div>
                    <span className={`text-lg font-bold uppercase tracking-wide ${selectedIndex === idx ? 'underline decoration-2 underline-offset-4' : ''}`}>{opt}</span>
                    <input
                      type="radio"
                      name="option"
                      value={idx}
                      checked={selectedIndex === idx}
                      onChange={() => setSelectedIndex(idx)}
                      className="sr-only"
                    />
                  </motion.label>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No options found.</p>
            )}
          </motion.div>

          <div className="pt-6 border-t-2 border-dashed border-gray-300">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white py-5 text-xl font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {submitting ? 'Authenticating...' : 'Cast Vote'}
            </motion.button>
            <p className="text-[10px] uppercase text-center mt-3 text-gray-400">
                By voting, you agree to sign a transaction on the blockchain.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">ZK Protected • Anonymous & Secure</span>
            </div>
          </div>
        </form>
      )}
      {/* Progress Overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-8"></div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Processing Secure Vote</h2>
            
            <div className="w-full max-w-xs space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors duration-300 ${
                    idx < currentStep ? 'bg-green-500 border-green-500' : 
                    idx === currentStep ? 'bg-black border-black animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.3)]' : 
                    'bg-white border-gray-300'
                  }`}>
                    {idx < currentStep && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                    idx === currentStep ? 'text-black' : 
                    idx < currentStep ? 'text-gray-400 line-through decoration-green-500/50' : 
                    'text-gray-300'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="mt-12 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
              Do not close window • Computing ZK Proof
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
