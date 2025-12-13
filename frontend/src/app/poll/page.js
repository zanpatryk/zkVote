'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { getOwnedPolls } from '@/lib/blockchain/engine/read'
import PollCard from '@/components/PollCard.jsx'
import Link from 'next/link'
import StatusFilter from '@/components/StatusFilter.jsx'

export default function PollsPage() {
  const { address, isConnected } = useAccount()
  const [polls, setPolls] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || poll.state.toString() === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="pt-24 max-w-5xl mx-auto px-6 pb-32 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold">Your polls</h1>
        <Link href="/poll/create">
          <button className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition">
            Create new poll
          </button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <StatusFilter 
          currentStatus={statusFilter} 
          onStatusChange={setStatusFilter} 
        />

        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search your polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-black/10 focus:border-black outline-none transition bg-white shadow-sm hover:border-black/30"
          />
        </div>
      </div>

      <div className="bg-white border-2 border-black rounded-3xl p-10 shadow-xl">
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600">Loading your polls...</div>
        ) : filteredPolls.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-500 font-medium">
            {polls.length === 0 ? "You have not created any polls yet" : "No polls found matching your filters"}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPolls.map((poll) => (
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