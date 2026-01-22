import { motion } from 'framer-motion'
import { memo } from 'react'

function PollSettings({ isAnonymous, setIsAnonymous, isSecret, setIsSecret, onOptionsLimitChange, vertical = false }) {
  // onOptionsLimitChange is called when turning on Secrecy to truncate options if >16
  
  const handleSecrecyToggle = () => {
    const next = !isSecret
    setIsSecret(next)
    if (next && onOptionsLimitChange) onOptionsLimitChange()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.22 }}
      className={`grid grid-cols-1 ${vertical ? '' : 'md:grid-cols-2'} gap-6 ${vertical ? 'mb-6' : 'mb-10'}`}
    >
      {/* Anonymity Toggle */}
      <div 
        onClick={() => setIsAnonymous(!isAnonymous)}
        className={`${vertical ? 'p-4' : 'p-6'} border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white cursor-pointer flex justify-between items-center hover:-translate-y-0.5 transition-all`}
      >
        <div className="flex-1 pr-4">
          <label className="block text-lg font-serif font-bold text-gray-900 mb-1 cursor-pointer">Anonymity</label>
          <p className="text-xs text-gray-500 leading-tight">Hide voter identities with ZK proofs.</p>
        </div>
        <div className={`w-14 h-8 border-2 border-black flex items-center px-1 transition-colors ${isAnonymous ? 'bg-black' : 'bg-white'}`}>
          <motion.div 
            animate={{ x: isAnonymous ? 22 : 0 }}
            className={`w-6 h-6 border-2 border-black ${isAnonymous ? 'bg-white' : 'bg-black'}`}
          />
        </div>
      </div>

      {/* Secrecy Toggle */}
      <div 
        onClick={handleSecrecyToggle}
        className={`${vertical ? 'p-4' : 'p-6'} border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white cursor-pointer flex justify-between items-center hover:-translate-y-0.5 transition-all`}
      >
        <div className="flex-1 pr-4">
          <label className="block text-lg font-serif font-bold text-gray-900 mb-1 cursor-pointer">Secrecy</label>
          <p className="text-xs text-gray-500 leading-tight">Encrypt votes until the poll duration ends.</p>
        </div>
        <div className={`w-14 h-8 border-2 border-black flex items-center px-1 transition-colors ${isSecret ? 'bg-black' : 'bg-white'}`}>
          <motion.div 
            animate={{ x: isSecret ? 22 : 0 }}
            className={`w-6 h-6 border-2 border-black ${isSecret ? 'bg-white' : 'bg-black'}`}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default memo(PollSettings)
