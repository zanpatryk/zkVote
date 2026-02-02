'use client'

import ErrorFallback from '@/components/ErrorFallback'

/**
 * Error boundary for poll creation page.
 * Catches errors during the poll creation form and submission process.
 */
export default function CreatePollError({ error, reset }) {
  const errorMessage = error?.message || ''

  let title = 'Creation Failed'
  let description = 'Failed to create your poll. Please try again.'

  if (errorMessage.includes('wallet') || errorMessage.includes('connect')) {
    title = 'Wallet Not Connected'
    description = 'Please connect your wallet to create a poll.'
  } else if (errorMessage.includes('funds')) {
    title = 'Insufficient Funds'
    description = 'You need ETH to pay for transaction fees.'
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
