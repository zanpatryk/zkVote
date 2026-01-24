'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import ReceiptCard from '@/components/ReceiptCard'
import { motion } from 'framer-motion'
import BackButton from '@/components/BackButton'

export default function VoteReceiptPage() {
  const { pollId, voteId } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const txHash = searchParams.get('txHash')
  const nullifier = searchParams.get('nullifier')
  const proof = searchParams.get('proof')

  const handleDownload = () => {
    const receiptData = {
      pollId,
      voteId,
      txHash,
      nullifier,
      timestamp: Date.now()
    }
    
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `zkvote-receipt-poll-${pollId}-vote-${voteId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center mb-12 gap-6 md:gap-0"
      >
         <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-black font-serif mb-2 tracking-tight">Vote Submitted</h1>
            <p className="text-xl text-gray-600 font-medium">Your vote has been successfully cast.</p>
         </div>
         <div className="w-full md:w-auto flex justify-end">
            <BackButton href="/vote" label="Back to Voting" />
         </div>
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
          nullifier={nullifier}
          proof={proof}
        />
      </motion.div>

      <div className="flex justify-center mt-8 text-center">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleDownload}
          className="bg-black text-white px-8 py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5L12 15m0 0l4.5-4.5M12 15V3" />
          </svg>
          Download Receipt
        </motion.button>
      </div>
    </div>
  )
}
