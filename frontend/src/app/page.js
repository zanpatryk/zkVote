"use client"

import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeroSection from '@/components/landing/HeroSection'
import StatsBanner from '@/components/landing/StatsBanner'
import ExperienceShowcase from '@/components/landing/ExperienceShowcase'
import HowItWorks from '@/components/landing/HowItWorks'
import CTASection from '@/components/landing/CTASection'

export default function LandingPage() {
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (isConnected) {
      router.push('/nfts')
    }
  }, [isConnected, router])

  // While redirecting or if connected, show nothing (or loading)
  if (isConnected) return null

  return (
    <div className="flex flex-col items-center pb-16 w-full">
      {/* First viewport section - Hero + Banner */}
      <div className="flex flex-col w-full" style={{ height: 'calc(100vh - 80px)' }}>
        <HeroSection />
        <StatsBanner />
      </div>
      
      <div className="w-full flex flex-col items-center px-6 space-y-16">
        <ExperienceShowcase />
        <HowItWorks />
        <CTASection />
      </div>
    </div>
  )
}