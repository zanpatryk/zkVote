'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'

export default function Navbar() {
  const { isConnected, address } = useAccount()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect logic (connect → /home, disconnect → /)
  useEffect(() => {
    const protectedRoutes = ['/home', '/poll', '/vote']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isConnected && pathname === '/') {
      router.replace('/home')
    } else if (!isConnected && isProtectedRoute) {
      router.replace('/restricted')
    }
  }, [isConnected, address, pathname, router])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo – left */}
        <Link
          href={isConnected ? '/home' : '/'}
          className="text-2xl font-bold hover:opacity-80 transition"
        >
          zkVote
        </Link>

        {/* Only when connected */}
        {isConnected && (
          <div className="absolute left-1/2 -translate-x-1/2 flex gap-10">
            <Link
              href="/poll"
              className={`font-medium text-lg transition ${
                pathname.startsWith('/poll')
                  ? 'text-black font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Poll
            </Link>
            <Link
              href="/vote"
              className={`font-medium text-lg transition ${
                pathname === '/vote'
                  ? 'text-black font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Vote
            </Link>
            <Link
              href="/verify"
              className={`font-medium text-lg transition ${
                pathname === '/verify'
                  ? 'text-black font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Verify
            </Link>
          </div>
        )}

        {/* Connect button – right */}
        <div className="flex items-center">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </nav>
  )
}