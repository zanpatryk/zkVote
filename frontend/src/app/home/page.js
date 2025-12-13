'use client'

import NFTDashboard from '@/components/NFTDashboard'

export default function HomePage() {
  return (
    <div className="pt-32 max-w-5xl mx-auto px-6 pb-32 space-y-16">
      
      {/* NFT Badges Section */}
      <NFTDashboard />
    </div>
  )
}