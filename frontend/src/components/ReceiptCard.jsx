'use client'

import Link from 'next/link'

export default function ReceiptCard({ pollId, voteId, txHash }) {
  return (
    <div className="bg-white p-6 md:p-8 max-w-sm mx-auto shadow-lg border border-gray-200 rounded-lg relative mb-8 font-mono text-left">
      {/* Receipt "holes" or decorative top/bottom could be added here, but keeping it clean for now */}
      
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">zkVote</h2>
        <p className="text-sm text-gray-500 mt-1">Vote Receipt</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase">Poll ID</p>
          <Link href={`/poll/${pollId}`} className="text-sm break-all hover:underline hover:text-black transition-colors block">
            {pollId}
          </Link>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase">Vote ID</p>
          <p className="text-sm break-all">{voteId}</p>
        </div>

        {txHash && (
          <div>
            <p className="text-xs text-gray-500 uppercase">Transaction Hash</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-black break-all underline decoration-dotted underline-offset-2 transition-colors"
            >
              {txHash}
            </a>
          </div>
        )}
      </div>

      <div className="border-t-2 border-dashed border-gray-300 pt-6 text-center">
        <p className="text-xs text-gray-400">Thank you for voting</p>
        {/* Timestamp could go here if available */}
        <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
