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
      {/* Title */}
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">Vote on Polls</h1>
        <p className="text-gray-500 text-lg">Participate in decentralized governance.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
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
            placeholder="Search polls to vote on..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-black focus:border-black outline-none transition bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none placeholder-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Direct Grid - No Container */}
      <div>
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600 font-serif italic">
            Loading polls...
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-xl">
             <p className="text-xl text-gray-400 font-serif italic">
               {polls.length === 0 ? "You are not whitelisted on any poll yet." : "No polls found matching your filters."}
             </p>
          </div>
        ) : (
          <div className="grid gap-8">
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