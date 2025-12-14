"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById } from '@/lib/blockchain/engine/read'
import PollDetails from '@/components/PollDetails'
import WhitelistManager from '@/components/WhitelistManager'
import PollStatusManager from '@/components/PollStatusManager.jsx'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function ManagePollPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()
  const [isOwner, setIsOwner] = useState(false)
  const [pollState, setPollState] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPollData = async () => {
    if (!isConnected || !userAddress || !pollId) {
      setLoading(false)
      return
    }

    try {
      const poll = await getPollById(pollId)
      if (poll && poll.creator.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true)
        setPollState(poll.state) // Store state
      } else {
        setIsOwner(false)
      }
    } catch (error) {
      console.error('Failed to fetch poll data:', error)
      toast.error('Failed to verify poll ownership.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPollData()
  }, [pollId, userAddress, isConnected])

  // ... (render logic)

        {pollState !== null && (
          <section className="border-t pt-8">
             <PollStatusManager 
               pollId={pollId} 
               status={Number(pollState)} 
               onStatusChange={() => {
                 fetchPollData()
               }}
             />
          </section>
        )}

  if (loading) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <p className="text-gray-600">Verifying ownership...</p>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">Please connect your wallet to manage this poll.</p>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">You are not the owner of this poll.</p>
        <button 
          onClick={() => router.push(`/poll/${pollId}`)}
          className="text-blue-600 hover:underline"
        >
          View Poll Details
        </button>
      </div>
    )
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
           <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">Manage Poll</h1>
           <p className="text-gray-500">Admin control panel.</p>
        </div>
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-600 hover:text-black font-medium"
        >
          ← Back to Dashboard
        </button>
      </motion.div>

      <div className="space-y-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 border-b-2 border-black pb-2">Poll Details</h2>
          <PollDetails pollId={pollId} />
        </motion.section>

        {pollState !== null && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
             <PollStatusManager 
               pollId={pollId} 
               status={Number(pollState)} 
               onStatusChange={() => {
                 fetchPollData()
               }}
             />
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-6 border-b-2 border-black pb-2">
             <h2 className="text-3xl font-serif font-bold text-gray-900">Whitelist Management</h2>
             <p className="text-gray-600 mt-1">Control who can vote in this poll.</p>
          </div>
          <WhitelistManager pollId={pollId} />
        </motion.section>
      </div>
    </div>
  )
}
