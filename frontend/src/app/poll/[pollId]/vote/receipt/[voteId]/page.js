'use client'

import { useParams, useSearchParams } from 'next/navigation'
import ReceiptCard from '@/components/ReceiptCard'
import { motion } from 'framer-motion'

export default function VoteReceiptPage() {
  const { pollId, voteId } = useParams()
  const searchParams = useSearchParams()
  const txHash = searchParams.get('txHash')

  const handleDownload = () => {
    const content = `zkVote Receipt\nPoll ID: ${BigInt(pollId).toString(16)}\nVote ID: ${BigInt(voteId).toString(16)}\nTx Hash: ${txHash || 'Not available'}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `zkvote-receipt-poll-${pollId}-vote-${voteId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-black font-serif mb-6 tracking-tight">Vote Submitted</h1>
        <p className="text-xl text-gray-600 mb-12 font-medium max-w-xl mx-auto">
          Your vote has been successfully cast. Here is your receipt.
        </p>
      </motion.div>

      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.2, type: "spring", bounce: 0, duration: 0.5 }}
      >
        <ReceiptCard 
          pollId={pollId} 
          voteId={voteId} 
          txHash={txHash} 
        />
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleDownload}
        className="bg-black text-white px-8 py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all mt-8"
      >
        Download Receipt (.txt)
      </motion.button>
    </div>
  )
}
