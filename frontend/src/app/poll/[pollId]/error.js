'use client'

import ErrorFallback from '@/components/ErrorFallback'

/**
 * Error boundary for poll-related pages.
 * Catches errors from:
 * - /poll/[pollId]
 * - /poll/[pollId]/vote
 * - /poll/[pollId]/manage
 * - /poll/[pollId]/nft
 * 
 * Common errors include:
 * - Invalid poll ID
 * - Network failures when fetching poll data
 * - ZK proof generation failures
 */
export default function PollError({ error, reset }) {
  // Determine error type for better messaging
  const errorMessage = error?.message || ''
  
  let title = 'Poll Error'
  let description = 'Failed to load poll information. Please try again.'

  if (errorMessage.includes('not found') || errorMessage.includes('Poll does not exist')) {
    title = 'Poll Not Found'
    description = 'This poll does not exist or has been removed.'
  } else if (errorMessage.includes('network') || errorMessage.includes('RPC')) {
    title = 'Connection Error'
    description = 'Unable to connect to the blockchain. Please check your network.'
  } else if (errorMessage.includes('proof') || errorMessage.includes('circuit')) {
    title = 'Proof Generation Failed'
    description = 'Failed to generate the zero-knowledge proof. Please try again.'
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
