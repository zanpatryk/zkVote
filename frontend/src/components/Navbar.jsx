'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { isConnected, address } = useAccount()
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Redirect logic (connect → /home, disconnect → /)
  useEffect(() => {
    const protectedRoutes = ['/home', '/poll', '/vote']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isConnected && pathname === '/') {
      router.replace('/home')
    } else if (!isConnected && isProtectedRoute) {
      router.replace('/')
    }
  }, [isConnected, address, pathname, router])

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { href: '/poll', label: 'Poll', isActive: (p) => p.startsWith('/poll') },
    { href: '/vote', label: 'Vote', isActive: (p) => p === '/vote' },
    { href: '/verify', label: 'Verify', isActive: (p) => p === '/verify' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-2 border-black bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        {/* Logo – left */}
        <Link
          href={isConnected ? '/home' : '/'}
          className="text-3xl font-serif font-black tracking-tight hover:opacity-80 transition"
        >
          zkVote
        </Link>

        {/* Desktop Navigation - Centered */}
        {isConnected && (
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-10">
            {navLinks.map((link) => {
              const active = link.isActive(pathname)
              return (
                <div key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={`font-medium text-lg transition-colors px-1 py-1 ${
                      active ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {active && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute left-0 right-0 bottom-0 h-[2px] bg-black"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Right Side: Connect Button + Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <ConnectButton showBalance={false} />

          {isConnected && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 -mr-2 text-black hover:bg-gray-100 rounded-md transition"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isConnected && isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t-2 border-black bg-white px-6 overflow-hidden shadow-xl"
          >
            <div className="py-6 flex flex-col gap-6">
              {navLinks.map((link) => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xl font-medium transition ${
                      link.isActive(pathname)
                        ? 'text-black font-bold'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {link.label}
                  </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}