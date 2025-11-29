'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-black mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-8">Page Not Found</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="text-gray-500 hover:text-black hover:underline mt-4 transition">
        Return to Landing Page
      </Link>
    </div>
  )
}
