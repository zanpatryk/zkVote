'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { getOwnedPolls } from '@/lib/blockchain/engine/read'
import PollCard from '@/components/PollCard.jsx'
import Link from 'next/link'

export default function PollsPage() {
  const { address, isConnected } = useAccount()
  const [polls, setPolls] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isConnected || !address) {
      setPolls([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    getOwnedPolls(address).then(async (data) => {
      if (cancelled) return

      // Check whitelist status for each poll
      const pollsWithWhitelist = await Promise.all(data.map(async (poll) => {
        const isWhitelisted = await import('@/lib/blockchain/engine/read').then(m => m.isUserWhitelisted(poll.pollId, address))
        return { ...poll, isWhitelisted }
      }))

      if (!cancelled) {
        setPolls(pollsWithWhitelist)
        setIsLoading(false)
      }
    }).catch(err => {
      console.error('Failed to load owned polls:', err)
      if (!cancelled) setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [address, isConnected])

  return (
    <div className="pt-24 max-w-5xl mx-auto px-6 pb-32">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold">Your polls</h1>
        <Link href="/poll/create">
          <button className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition">
            Create new poll
          </button>
        </Link>
      </div>

      <div className="bg-white border-2 border-black rounded-3xl p-10 shadow-xl">
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600">Loading your polls...</div>
        ) : polls.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-500 font-medium">
            You have not created any polls yet
          </div>
        ) : (
          <div className="grid gap-6">
            {polls.map((poll) => (
              <PollCard 
                key={poll.pollId} 
                pollId={poll.pollId} 
                title={poll.title} 
                state={poll.state}
                isOwner 
                showVoteButton={poll.isWhitelisted && poll.state === 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}