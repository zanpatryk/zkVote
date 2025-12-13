'use client'

import VoteChecker from '@/components/VoteChecker'

export default function VerifyPage() {
  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32 text-center">
      <h1 className="text-4xl font-bold mb-4">Verify Your Vote</h1>
      <p className="text-lg text-gray-600 mb-12">
        Upload your vote receipt file to check your vote status and details on the blockchain.
      </p>
      
      <VoteChecker />
    </div>
  )
}
