'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import VoteChecker from '@/components/VoteChecker'
import { getPollById } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'

export default function PollVerifyPage({ params }) {
  const { pollId } = use(params)
  const router = useRouter()
  const { address } = useAccount()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [storedReceipt, setStoredReceipt] = useState(null)

  useEffect(() => {
    if (!pollId) return
    
    // Check for stored receipt
    if (address) {
      const data = localStorage.getItem(`zk-receipt-${address.toLowerCase()}-${pollId}`)
      if (data) {
        try {
          setStoredReceipt(JSON.parse(data))
        } catch (e) {
          console.error('Failed to parse stored receipt', e)
        }
      }
    }

    getPollById(pollId).then(data => {
      setPoll(data)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load poll:', err)
      toast.error('Failed to load poll details')
      setLoading(false)
    })
  }, [pollId, address])

  const handleVerifyFromWallet = () => {
    if (!storedReceipt) return

    const { voteId, txHash, nullifier, proof } = storedReceipt
    const params = new URLSearchParams({
      ...(txHash && { txHash }),
      ...(nullifier && { nullifier }),
      ...(proof && { proof })
    }).toString()

    const url = `/poll/${pollId}/vote/check/${voteId}${params ? `?${params}` : ''}`
    router.push(url)
  }

  if (loading) {
    return (
      <div className="pt-32 text-center">
        <div className="animate-pulse text-xl font-serif text-gray-500">Loading poll details...</div>
      </div>
    )
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <Link href={`/poll/${pollId}`}>
          <button className="text-gray-600 hover:text-black font-medium transition mb-6 flex items-center gap-2">
            ← Back to Poll
          </button>
        </Link>
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Verify Your Vote</h1>
        <p className="text-lg text-gray-600">
          Upload your receipt for <strong>{poll?.title || 'this poll'}</strong> to verify your vote status on-chain.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {!address && (
          <div className="mb-12 p-8 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2 text-blue-900">Check for Saved Receipts</h2>
            <p className="text-blue-700 mb-6">Connect your wallet to see if you have any saved vote receipts for this poll.</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px bg-blue-200 flex-1"></div>
              <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">or upload file below</span>
              <div className="h-px bg-blue-200 flex-1"></div>
            </div>
          </div>
        )}

        {storedReceipt && address && (
          <div className="mb-12 p-8 bg-black/5 border-2 border-black border-dashed rounded-lg text-center">
            <h2 className="text-xl font-bold mb-2">Saved Receipt Found</h2>
            <p className="text-gray-600 mb-6">We found a vote receipt for this poll saved in your browser storage.</p>
            <button 
              onClick={handleVerifyFromWallet}
              className="bg-black text-white px-8 py-4 rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              Verify with Wallet Storage
            </button>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">or upload file</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          </div>
        )}

        {/* Handle case where wallet is connected but no receipt found */}
        {address && !storedReceipt && (
           <div className="mb-12 p-6 bg-gray-50 border-2 border-gray-200 border-dashed rounded-lg text-center opacity-75">
             <h2 className="text-lg font-bold mb-1 text-gray-500">No Saved Receipt Found</h2>
             <p className="text-gray-400 text-sm mb-4">We couldn't find a receipt for this poll in your browser storage.</p>
             
             <div className="flex items-center justify-center gap-2">
               <div className="h-px bg-gray-200 flex-1"></div>
               <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">please manually upload below</span>
               <div className="h-px bg-gray-200 flex-1"></div>
             </div>
           </div>
        )}
        <VoteChecker />
      </motion.div>
    </div>
  )
}
