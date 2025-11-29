'use client'

import Link from 'next/link'

export default function RestrictedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold text-black mb-6">Restricted Access</h1>
        <p className="text-xl text-gray-600 mb-10">
          You need to connect your wallet to view this page. Please connect using the button in the navbar to continue.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="text-gray-500 hover:text-black hover:underline mt-4 transition">
            Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  )
}
