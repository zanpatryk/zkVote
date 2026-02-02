import { motion, AnimatePresence } from 'framer-motion'

export default function VoterCapacity({ depth, setDepth }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 40 }} 
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
      className="overflow-hidden pr-2 pb-2 -mr-2 -mb-2"
    >
      <label className="block text-xl font-serif font-bold text-gray-900 mb-2">
        Voter Capacity
      </label>
      <p className="text-sm text-gray-500 max-w-lg mb-4">
        Larger capacity results in larger fees and proof sizes.
      </p>
      
      <div className="p-6 border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
        <input
          type="range"
          min="16"
          max="32"
          step="1"
          value={depth}
          onChange={e => setDepth(parseInt(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black border-2 border-black"
        />
        <div className="mt-4 flex flex-col-reverse md:flex-row justify-between items-center gap-6 md:gap-0">
          <div className="flex gap-2 w-full md:w-auto justify-center md:justify-start">
            <button
              type="button"
              onClick={() => setDepth(d => Math.max(d - 1, 16))}
              className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xl font-bold"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setDepth(d => Math.min(d + 1, 32))}
              className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-xl font-bold"
            >
              +
            </button>
          </div>

          <div className="text-center md:text-right w-full md:w-auto overflow-hidden">
            <div className="h-10 flex items-center justify-center md:justify-end font-serif text-3xl font-black tabular-nums">
              {(Math.pow(2, depth)).toLocaleString().split('').map((char, i) => (
                <span key={i} className="inline-block relative w-[0.6em] h-10" style={{ perspective: '300px' }}>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={char}
                      initial={{ opacity: 0, rotateX: -90, y: 15 }}
                      animate={{ opacity: 1, rotateX: 0, y: 0 }}
                      exit={{ opacity: 0, rotateX: 90, y: -15 }}
                      transition={{ 
                        duration: 0.35,
                        ease: [0.23, 1, 0.32, 1] 
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {char}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Max Participants</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
