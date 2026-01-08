'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'
import { motion } from 'framer-motion'

export default function VoteCheckPage() {
  const router = useRouter()
  const { pollId, voteId } = useParams()
  const searchParams = useSearchParams()
  const txHash = searchParams.get('txHash')
  const nullifier = searchParams.get('nullifier')
  const proof = searchParams.get('proof')

  const [vote, setVote] = useState(null)
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [derivedAddrMatch, setDerivedAddrMatch] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [voteData, pollData] = await Promise.all([
          getVote(voteId),
          getPollById(pollId)
        ])

        if (!voteData) {
          setError('Vote not found or could not be loaded.')
        } else {
          setVote(voteData)
          
          // Verify nullifier if provided
          if (nullifier) {
            const { getAddress } = await import('viem')
            const derivedVoter = getAddress(`0x${(BigInt(nullifier) & ((1n << 160n) - 1n)).toString(16).padStart(40, '0')}`)
            setDerivedAddrMatch(getAddress(voteData.voter) === derivedVoter)
          }
        }

        if (pollData) {
          setPoll(pollData)
        }
      } catch (err) {
        console.error('Failed to load details:', err)
        setError('Failed to load details.')
      } finally {
        setLoading(false)
      }
    }

    if (pollId && voteId) {
      loadData()
    }
  }, [pollId, voteId, nullifier])

  const optionText = vote && poll && poll.options && poll.options[Number(vote.optionIdx)]
    ? poll.options[Number(vote.optionIdx)]
    : 'Unknown Option'
    
  // Determine action button based on poll state
  const isActive = poll?.state === 1
  const isEnded = poll?.state === 2

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-left">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
          <h1 className="text-4xl font-black font-serif tracking-tight mb-2">Vote Details</h1>
          <p className="text-gray-500 text-lg">Verify your vote on the blockchain.</p>
        </div>
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-500 hover:text-black whitespace-nowrap font-medium transition-colors"
        >
          ← Go Back
        </button>
      </motion.div>

      {loading ? (
        <p className="text-gray-600 font-serif italic text-xl text-center py-20">Loading data...</p>
      ) : error ? (
        <p className="text-red-600 font-serif font-bold text-center py-20">{error}</p>
      ) : (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }} // Smoother non-bouncy entry
          className="bg-white p-8 max-w-md mx-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative mb-12"
        >
          
           {/* Receipt Header */}
           <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
            <h2 className="text-3xl font-black font-serif tracking-tight uppercase">zkVote</h2>
            <motion.p 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-widest"
            >
              Verified Record
            </motion.p>
           </div>

          <div className="space-y-4 mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs text-gray-500 uppercase">Poll ID</p>
              <Link href={`/poll/${pollId}`} className="text-sm break-all font-mono hover:underline hover:text-black transition-colors block">
                {pollId}
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-xs text-gray-500 uppercase">Vote ID</p>
              <p className="text-sm break-all font-mono">{voteId}</p>
            </motion.div>

            {nullifier && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
              >
                <p className="text-xs text-gray-500 uppercase flex items-center gap-2">
                  Nullifier Hash
                  {derivedAddrMatch === true && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1 border border-green-200">MATCHED</span>
                  )}
                  {derivedAddrMatch === false && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1 border border-red-200">MISMATCH</span>
                  )}
                </p>
                <p className="text-sm break-all font-mono">{nullifier}</p>
              </motion.div>
            )}

            {proof && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.58 }}
              >
                <p className="text-xs text-gray-500 uppercase">ZK Proof</p>
                <p className="text-[10px] break-all font-mono text-gray-400 line-clamp-2 leading-tight">
                  {proof}
                </p>
              </motion.div>
            )}

            {txHash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-xs text-gray-500 uppercase">Transaction Hash</p>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 font-mono hover:text-black break-all underline decoration-dotted underline-offset-2 transition-colors block"
                >
                  {txHash}
                </a>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-4 border-t border-dashed border-gray-200"
            >
               <p className="text-xs text-gray-500 uppercase mb-1">Selected Option</p>
               <p className="text-xl font-bold font-sans">{optionText}</p>
            </motion.div>

            {vote.timestamp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                 <p className="text-xs text-gray-500 uppercase mt-4">Timestamp</p>
                 <p className="text-gray-800 text-sm">{new Date(Number(vote.timestamp) * 1000).toLocaleString()}</p>
              </motion.div>
            )}
          </div>
          
           {/* Action Button */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.9 }}
             className="mt-8 pt-8 border-t-2 border-dashed border-gray-300 text-center font-sans space-y-4"
           >
              {isActive ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/poll/${pollId}`)}
                  className="w-full bg-black text-white px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  View Active Poll
                </motion.button>
              ) : isEnded ? (
                 <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/poll/${pollId}/nft`)}
                  className="w-full bg-black text-white px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  View Results & Mint NFT
                </motion.button>
              ) : (
                 <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/poll/${pollId}`)}
                  className="w-full bg-white text-black px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                >
                  Return to Poll
                </motion.button>
              )}
           </motion.div>
        </motion.div>
      )}
    </div>
  )
}
