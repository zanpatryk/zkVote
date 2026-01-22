'use client'

import ErrorFallback from '@/components/ErrorFallback'

/**
 * Error boundary for the registration page.
 * Catches errors during Semaphore identity creation and registration.
 */
export default function RegisterError({ error, reset }) {
  const errorMessage = error?.message || ''

  let title = 'Registration Error'
  let description = 'Failed to register for this poll. Please try again.'

  if (errorMessage.includes('identity') || errorMessage.includes('commitment')) {
    title = 'Identity Error'
    description = 'Failed to create or verify your anonymous identity. Please try again.'
  } else if (errorMessage.includes('already registered') || errorMessage.includes('already a member')) {
    title = 'Already Registered'
    description = 'You have already registered for this poll.'
  } else if (errorMessage.includes('whitelist')) {
    title = 'Not Whitelisted'
    description = 'You must be whitelisted before you can register for this poll.'
  } else if (errorMessage.includes('poll') && errorMessage.includes('not')) {
    title = 'Registration Closed'
    description = 'This poll is not currently accepting registrations.'
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
