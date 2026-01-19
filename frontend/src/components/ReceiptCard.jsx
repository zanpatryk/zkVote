'use client'

import Link from 'next/link'
import { getExplorerTxUrl } from '@/lib/utils/explorer'

export default function ReceiptCard({ pollId, voteId, txHash, nullifier, proof, interactive = true }) {
  return (
    <div className="bg-white p-6 md:p-8 max-w-sm mx-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative mb-8 font-mono text-left">      
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">zkVote</h2>
        <p className="text-sm text-gray-500 mt-1">Vote Receipt</p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase">Poll ID</p>
          {interactive ? (
            <Link href={`/poll/${pollId}`} className="text-sm break-all hover:underline hover:text-black transition-colors block">
              {pollId}
            </Link>
          ) : (
            <span className="text-sm break-all block text-gray-900">{pollId}</span>
          )}
        </div>
        
        <div>
          <p className="text-xs text-gray-500 uppercase">Vote ID</p>
          <p className="text-sm break-all">{voteId}</p>
        </div>

        {txHash && (
          <div>
            <p className="text-xs text-gray-500 uppercase">Transaction Hash</p>
            {interactive ? (
              <a 
                href={getExplorerTxUrl(txHash)}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-black break-all underline decoration-dotted underline-offset-2 transition-colors"
              >
                {txHash}
              </a>
            ) : (
              <span className="text-sm text-gray-600 break-all">{txHash}</span>
            )}
          </div>
        )}

        {nullifier && (
          <div>
            <p className="text-xs text-gray-500 uppercase">Nullifier Hash</p>
            <p className="text-sm text-gray-600 break-all">{nullifier}</p>
          </div>
        )}

        {proof && (
          <div>
            <p className="text-xs text-gray-500 uppercase">ZK Proof</p>
            <p className="text-sm text-gray-600 break-all">
              {proof.length > 50 ? `${proof.substring(0, 50)}...` : proof}
            </p>
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
