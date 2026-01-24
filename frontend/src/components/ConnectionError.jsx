import { motion } from 'framer-motion'

export default function ConnectionError({ error, onRetry }) {
  if (!error) return null

  // Ensure onRetry is a function, default to reload if not provided
  const handleRetry = onRetry || (() => window.location.reload())
  
  const isNetworkError = error.toString().toLowerCase().includes('network')

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 border-2 border-red-200 bg-red-50 rounded-xl"
    >
      <div className="text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      {isNetworkError && (
        <h3 className="text-xl font-bold text-red-800 mb-2">Connection Error</h3>
      )}
      <p className="text-red-600 font-bold text-lg mb-4 max-w-lg mx-auto">
        {isNetworkError
          ? 'Could not connect to the network. Please make sure you are on the correct chain.'
          : error.toString()}
      </p>
      <button 
        onClick={handleRetry}
        className="text-sm underline text-red-800 hover:text-black font-semibold"
      >
        Try Again
      </button>
    </motion.div>
  )
}
