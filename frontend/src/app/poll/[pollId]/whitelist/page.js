"use client"
import WhitelistManager from '@/components/WhitelistManager'
import { useParams, useRouter } from 'next/navigation'

export default function WhitelistPage() {
  const { pollId } = useParams()
  const router = useRouter()

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <h1 className="text-4xl font-bold mb-10">Whitelist Voters</h1>
      <WhitelistManager 
        pollId={pollId} 
        onSuccess={() => router.push('/poll')}
      />
    </div>
  )
}