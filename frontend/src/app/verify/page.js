'use client'

import VoteChecker from '@/components/VoteChecker'

export default function VerifyPage() {
  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32 text-center">
      <h1 className="text-5xl font-serif font-bold text-gray-900 mb-6">Verify Your Vote</h1>
      <p className="text-xl text-gray-600 mb-16 font-light max-w-2xl mx-auto">
        Upload your vote receipt file to audit your vote on the blockchain.
      </p>
      
      <VoteChecker />
    </div>
  )
}
