'use client'

import { useAccount } from 'wagmi'
import { getWhitelistedPolls } from '@/lib/blockchain/engine/read'
import { useQuery } from '@tanstack/react-query'
import PollCard from '@/components/PollCard.jsx'

import { useState } from 'react'
import StatusFilter from '@/components/StatusFilter.jsx'

export default function VotePage() {
  const { address, isConnected } = useAccount()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['whitelistedPolls', address],
    queryFn: () => getWhitelistedPolls(address),
    enabled: isConnected && !!address,
  })

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || poll.state.toString() === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="pt-24 max-w-5xl mx-auto px-6 pb-32 relative">
      {/* Title – outside the box */}
      <h1 className="text-4xl font-bold mb-6 text-left">Vote on polls</h1>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search polls to vote on..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-black/10 focus:border-black outline-none transition bg-white shadow-sm hover:border-black/30"
          />
        </div>
        
        <StatusFilter 
          currentStatus={statusFilter} 
          onStatusChange={setStatusFilter} 
        />
      </div>

      {/* The separated box */}
      <div className="bg-white border-2 border-black rounded-3xl p-10 shadow-xl">
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600">
            Loading polls...
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-500 font-medium">
             {polls.length === 0 ? "You are not whitelisted on any poll yet" : "No polls found matching your filters"}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPolls.map((poll) => (
              <PollCard 
                key={poll.pollId} 
                pollId={poll.pollId} 
                title={poll.title} 
                state={poll.state}
                isOwner={poll.creator === address}
                showVoteButton 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}