'use client'

import Link from 'next/link'

export default function RestrictedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-black font-serif text-black mb-6 tracking-tight">Restricted Access</h1>
        <p className="text-xl text-gray-600 mb-10 font-medium">
          You need to connect your wallet to view this page. Please connect using the button in the navbar to continue.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <Link 
            href="/" 
            className="px-8 py-4 bg-black text-white text-lg font-bold rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
          >
            Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  )
}
