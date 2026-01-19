'use client'

import ErrorFallback from '@/components/ErrorFallback'

/**
 * Global error boundary for the entire application.
 * Catches any unhandled errors that bubble up from child routes.
 * 
 * This is the last line of defense - specific route-level error.js files
 * will catch errors before they reach this handler.
 */
export default function GlobalError({ error, reset }) {
  return (
    <ErrorFallback 
      error={error} 
      reset={reset}
      title="Application Error"
      description="An unexpected error occurred in zkVote. Please try again or return to the home page."
    />
  )
}
