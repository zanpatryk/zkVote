'use client'

/**
 * A reusable error fallback component for displaying error states.
 * Used by both Next.js error boundaries and custom error handling.
 * 
 * @param {Object} props
 * @param {Error} props.error - The error that was caught
 * @param {Function} props.reset - Function to attempt recovery (from Next.js error boundary)
 * @param {string} props.title - Optional custom title
 * @param {string} props.description - Optional custom description
 */
export default function ErrorFallback({ 
  error, 
  reset, 
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 mb-6 border-2 border-black rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold">!</span>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        
        {/* Error Description */}
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Development Error Details */}
        {isDev && error && (
          <div className="mb-6 p-4 bg-gray-100 border-2 border-black rounded-lg text-left overflow-auto max-h-40">
            <p className="font-mono text-sm text-red-600 break-words">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-gray-500 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reset && (
            <button
              onClick={reset}
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors border-2 border-black"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors border-2 border-black"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
