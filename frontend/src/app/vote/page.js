'use client'

import { useAccount } from 'wagmi'
import { getWhitelistedPolls } from '@/lib/blockchain/engine/read'
import { useQuery } from '@tanstack/react-query'
import PollCard from '@/components/PollCard'

export default function VotePage() {
  const { address, isConnected } = useAccount()

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['whitelistedPolls', address],
    queryFn: () => getWhitelistedPolls(address),
    enabled: isConnected && !!address,
  })

  return (
    <div className="pt-24 max-w-5xl mx-auto px-6 pb-32">
      {/* Title – outside the box */}
      <h1 className="text-4xl font-bold mb-10 text-left">Vote on polls</h1>

      {/* The separated box */}
      <div className="bg-white border-2 border-black rounded-3xl p-10 shadow-xl">
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600">
            Loading polls...
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-500 font-medium">
            You are not whitelisted on any poll yet
          </div>
        ) : (
          <div className="grid gap-6">
            {polls.map((poll) => (
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