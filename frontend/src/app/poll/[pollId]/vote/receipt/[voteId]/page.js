'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import ReceiptCard from '@/components/ReceiptCard'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'

export default function VoteReceiptPage() {
  const { pollId, voteId } = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const searchParams = useSearchParams()
  const txHash = searchParams.get('txHash')
  const nullifier = searchParams.get('nullifier')
  const proof = searchParams.get('proof')

  const handleDownload = () => {
    let content = `zkVote Receipt\n`
    content += `Poll ID: ${pollId}\n`
    content += `Vote ID: ${voteId}\n`
    content += `Tx Hash: ${txHash || 'Not available'}\n`
    if (nullifier) content += `Nullifier Hash: ${nullifier}\n`
    if (proof) content += `ZK Proof: ${proof}\n`
    
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

  const handleSaveToWallet = () => {
    if (!address) {
      toast.error('Please connect your wallet to save the receipt')
      return
    }

    const receiptData = {
      pollId,
      voteId,
      txHash,
      nullifier,
      proof,
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(`zk-receipt-${address.toLowerCase()}-${pollId}`, JSON.stringify(receiptData))
      toast.success('Receipt saved to your wallet storage!')
    } catch (error) {
      console.error('Failed to save receipt:', error)
      toast.error('Failed to save receipt to browser storage')
    }
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
          nullifier={nullifier}
          proof={proof}
        />
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleSaveToWallet}
          className="bg-white text-black px-8 py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          Save to Wallet (Browser)
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleDownload}
          className="bg-black text-white px-8 py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          Download Receipt (.txt)
        </motion.button>
      </div>
    </div>
  )
}
