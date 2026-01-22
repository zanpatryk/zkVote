'use client'

import ErrorFallback from '@/components/ErrorFallback'

/**
 * Error boundary for the poll management page.
 * Catches errors during tally decryption, proof generation, and result publishing.
 */
export default function ManageError({ error, reset }) {
  const errorMessage = error?.message || ''

  let title = 'Management Error'
  let description = 'Failed to manage this poll. Please try again.'

  if (errorMessage.includes('decrypt') || errorMessage.includes('private key')) {
    title = 'Decryption Failed'
    description = 'Failed to decrypt the poll results. Please ensure you have the correct private key.'
  } else if (errorMessage.includes('proof') || errorMessage.includes('circuit')) {
    title = 'Proof Generation Failed'
    description = 'Unable to generate the decryption proof. This may be due to missing circuit files.'
  } else if (errorMessage.includes('publish') || errorMessage.includes('tally')) {
    title = 'Publishing Failed'
    description = 'Failed to publish the results on-chain. Please check your connection and try again.'
  } else if (errorMessage.includes('owner') || errorMessage.includes('unauthorized')) {
    title = 'Unauthorized'
    description = 'Only the poll owner can manage this poll.'
  } else if (errorMessage.includes('not ended') || errorMessage.includes('still active')) {
    title = 'Poll Still Active'
    description = 'You can only decrypt results after the poll has ended.'
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
