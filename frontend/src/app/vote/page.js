'use client'

import { useAccount } from 'wagmi'
import PollCard from '@/components/PollCard.jsx'
import StatusFilter from '@/components/StatusFilter.jsx'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useWhitelistedPolls } from '@/hooks/usePolls'
import { usePollFilter } from '@/hooks/usePollFilter'
import ConnectionError from '@/components/ConnectionError'

export default function VotePage() {
  const { address, isConnected } = useAccount()
  
  const { polls, isLoading, error } = useWhitelistedPolls(address, isConnected)
  
  const { 
    searchQuery, 
    setSearchQuery, 
    statusFilter, 
    setStatusFilter, 
    filteredPolls 
  } = usePollFilter(polls)

  return (
    <div className="pt-24 max-w-5xl mx-auto px-6 pb-32 relative">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0">
          <div>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">Vote on Polls</h1>
            <p className="text-gray-500 text-lg">Participate in decentralized governance.</p>
          </div>
          <Link href="/vote/upload" className="w-full md:w-auto">
             <button className="w-full md:w-auto bg-black text-white px-8 py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
               </svg>
               Vote with Identity
             </button>
          </Link>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-12"
      >
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
      </motion.div>

      {/* Direct Grid - No Container */}
      <div>
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600 font-serif italic">
            Loading polls...
          </div>
        ) : error ? (
           <ConnectionError error={error} />
        ) : filteredPolls.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-xl">
             <p className="text-xl text-gray-400 font-serif italic">
                {!polls || polls.length === 0 ? "You are not whitelisted on any poll yet." : "No polls found matching your filters."}
             </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredPolls.map((poll) => (
                <motion.div
                  layout
                  key={poll.pollId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <PollCard 
                    pollId={poll.pollId} 
                    title={poll.title} 
                    state={poll.state}
                    isOwner={poll.creator === address}
                    showVoteButton 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}