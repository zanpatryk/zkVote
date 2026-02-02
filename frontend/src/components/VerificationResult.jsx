'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'
import { useExplorer } from '@/hooks/useExplorer'
import { motion } from 'framer-motion'

export default function VerificationResult({ pollId, voteId, txHash, nullifier, proof, onReset }) {
  const router = useRouter()
  const { getTxUrl } = useExplorer()
  const [vote, setVote] = useState(null)
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [derivedAddrMatch, setDerivedAddrMatch] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [voteResult, pollResult] = await Promise.all([
          getVote(voteId, pollId),
          getPollById(pollId)
        ])

        const voteData = voteResult.data
        const pollData = pollResult.data

        if (!voteData) {
          setError('Vote not found or could not be loaded.')
        } else {
          setVote(voteData)
          
          if (nullifier && voteData.voter) {
            const { getAddress } = await import('viem')
            try {
                const derivedVoter = getAddress(`0x${(BigInt(nullifier) & ((1n << 160n) - 1n)).toString(16).padStart(40, '0')}`)
                setDerivedAddrMatch(getAddress(voteData.voter) === derivedVoter)
            } catch (e) {
                setDerivedAddrMatch(false)
            }
          }
        }

        if (pollData) setPoll(pollData)
      } catch (err) {
        setError('Failed to load blockchain details.')
      } finally {
        setLoading(false)
      }
    }

    if (pollId && voteId) loadData()
  }, [pollId, voteId, nullifier])

  if (loading) return <p className="text-gray-600 font-serif italic text-xl text-center py-20">Verifying on-chain...</p>
  if (error) return (
    <div className="text-center py-20">
      <p className="text-red-600 font-bold mb-4">{error}</p>
      <button onClick={onReset} className="text-black font-bold underline">Try another receipt</button>
    </div>
  )

  const optionText = vote && poll && vote.optionIdx !== null && poll.options?.[Number(vote.optionIdx)]
  const isActive = poll?.state === 1
  const isEnded = poll?.state === 2

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative mb-8 text-left font-mono">
        <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
          <h2 className="text-3xl font-black font-serif uppercase">zkVote</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium uppercase tracking-widest">Verified Record</p>
        </div>

        <div className="space-y-4 mb-8">
          {poll?.title && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Poll Title</p>
              <p className="text-sm font-bold">{poll.title}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase">Poll ID</p>
            <Link href={`/poll/${pollId}`} className="text-sm break-all hover:underline">{pollId}</Link>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Vote ID</p>
            <p className="text-sm break-all">{voteId}</p>
          </div>

          {nullifier && (
            <div>
              <p className="text-xs text-gray-500 uppercase flex items-center gap-2">
                Nullifier Hash
                {derivedAddrMatch === true && <span className="text-[10px] bg-green-100 text-green-700 px-1 border border-green-200">MATCHED</span>}
                {derivedAddrMatch === false && <span className="text-[10px] bg-red-100 text-red-700 px-1 border border-red-200">MISMATCH</span>}
              </p>
              <p className="text-sm break-all">{nullifier}</p>
            </div>
          )}

          {txHash && (
            <div>
              <p className="text-xs text-gray-500 uppercase">Transaction Hash</p>
              <a href={getTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 underline decoration-dotted block break-all">
                {txHash}
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-dashed border-gray-200">
             <p className="text-xs text-gray-500 uppercase mb-1">Authenticated Choice</p>
             {optionText ? (
               <p className="text-xl font-bold font-sans">{optionText}</p>
             ) : (
               <div className="flex items-center gap-2 text-gray-500 italic">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted Vote</span>
               </div>
             )}
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-300 space-y-4">
          <button
            onClick={() => router.push(isActive ? `/poll/${pollId}` : isEnded ? `/poll/${pollId}/nft` : `/poll/${pollId}`)}
            className="w-full bg-black text-white px-6 py-4 text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
          >
            {isActive ? 'View Active Poll' : isEnded ? 'View Results & Mint NFT' : 'Return to Poll'}
          </button>
          
          <button
            onClick={onReset}
            className="w-full bg-white text-black px-6 py-4 text-sm font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all uppercase tracking-widest"
          >
            Verify Another Receipt
          </button>
        </div>
      </div>
    </motion.div>
  )
}
