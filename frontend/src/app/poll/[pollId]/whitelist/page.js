"use client"
import WhitelistManager from '@/components/WhitelistManager'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getPollById } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'

import Link from 'next/link'

import WhitelistedAddressesList from '@/components/WhitelistedAddressesList'

export default function WhitelistPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const [pollState, setPollState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPoll = async () => {
        if (!pollId) return
        try {
            const data = await getPollById(pollId)
            if (data) {
                setPollState(data.state)
            }
        } catch (error) {
            console.error('Failed to fetch poll:', error)
            toast.error('Failed to load poll data')
        } finally {
            setLoading(false)
        }
    }
    fetchPoll()
  }, [pollId])

  if (loading) {
      return (
          <div className="pt-32 max-w-3xl mx-auto px-6 text-center">
              <p className="text-gray-500">Loading...</p>
          </div>
      )
  }

  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <Link href={`/poll/${pollId}/manage`}>
          <button className="text-gray-600 hover:text-black font-medium transition mb-6 flex items-center gap-2">
            ← Manage Poll
          </button>
        </Link>
        <h1 className="text-5xl font-black font-serif mb-4 tracking-tight">Whitelist Voters</h1>
        <p className="text-xl text-gray-600 font-medium">Add wallet addresses that are allowed to register their ZK membership and participate in voting.</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <WhitelistManager 
          pollId={pollId} 
          pollState={pollState}
        />
        <WhitelistedAddressesList pollId={pollId} />
      </motion.div>
    </div>
  )
}