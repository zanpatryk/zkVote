'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { getOwnedPolls } from '@/lib/blockchain/engine/read'
import PollCard from '@/components/PollCard.jsx'
import Link from 'next/link'
import StatusFilter from '@/components/StatusFilter.jsx'
import { motion, AnimatePresence } from 'framer-motion'

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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-12"
      >
        <div>
          <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">My Polls</h1>
          <p className="text-gray-500 text-lg">Manage your secure voting events.</p>
        </div>
        <Link href="/poll/create">
          <button className="bg-black text-white px-8 py-4 rounded-lg text-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
            + Create New Poll
          </button>
        </Link>
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
            placeholder="Search your polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-black focus:border-black outline-none transition bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none placeholder-gray-400 font-medium"
          />
        </div>
      </motion.div>

      <div>
        {isLoading ? (
          <div className="text-center py-20 text-xl text-gray-600 font-serif italic">Loading your polls...</div>
        ) : filteredPolls.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-xl">
             <p className="text-xl text-gray-400 font-serif italic">
                {polls.length === 0 ? "You haven't created any polls yet." : "No polls match your search."}
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
              {filteredPolls.map((poll, index) => (
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
                    isOwner 
                    showVoteButton={poll.isWhitelisted && poll.state === 1}
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