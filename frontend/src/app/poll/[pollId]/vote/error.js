'use client'

import ErrorFallback from '@/components/ErrorFallback'

/**
 * Error boundary for the voting page.
 * Catches errors during vote selection, proof generation, and submission.
 */
export default function VotingError({ error, reset }) {
  const errorMessage = error?.message || ''

  let title = 'Voting Error'
  let description = 'Failed to process your vote. Please try again.'

  if (errorMessage.includes('proof') || errorMessage.includes('circuit')) {
    title = 'Proof Generation Failed'
    description = 'Unable to generate your anonymous voting proof. This may be due to missing circuit files. Please refresh and try again.'
  } else if (errorMessage.includes('already voted') || errorMessage.includes('0xaef0604b')) {
    title = 'Already Voted'
    description = 'You have already cast a vote in this poll.'
  } else if (errorMessage.includes('not eligible') || errorMessage.includes('whitelist')) {
    title = 'Not Eligible'
    description = 'You are not eligible to vote in this poll.'
  }

  return (
    <ErrorFallback 
      error={error} 
      reset={reset}
      title={title}
      description={description}
    />
  )
}
