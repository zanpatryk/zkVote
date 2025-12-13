'use client'

import { useParams, useSearchParams } from 'next/navigation'
import ReceiptCard from '@/components/ReceiptCard'

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
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
      <h1 className="text-4xl font-bold mb-4">Vote Submitted</h1>
      <p className="text-lg text-gray-700 mb-12">
        Your vote has been successfully cast. Here is your receipt.
      </p>

      <ReceiptCard 
        pollId={pollId} 
        voteId={voteId} 
        txHash={txHash} 
      />

      <button
        type="button"
        onClick={handleDownload}
        className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition shadow-md mt-4"
      >
        Download Receipt (.txt)
      </button>
    </div>
  )
}
