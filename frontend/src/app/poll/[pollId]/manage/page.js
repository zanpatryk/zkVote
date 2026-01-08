"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, getMerkleTreeDepth } from '@/lib/blockchain/engine/read'
import PollDetails from '@/components/PollDetails'
import WhitelistManager from '@/components/WhitelistManager'
import PollStatusManager from '@/components/PollStatusManager.jsx'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import WhitelistedAddressesList from '@/components/WhitelistedAddressesList'
import VotesList from '@/components/VotesList'
import RegistrationList from '@/components/RegistrationList'

export default function ManagePollPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()
  const [isOwner, setIsOwner] = useState(false)
  const [pollState, setPollState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [maxParticipants, setMaxParticipants] = useState(null)
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'whitelist'

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

        // Fetch capacity
        const depth = await getMerkleTreeDepth(pollId)
        setMaxParticipants(Math.pow(2, depth))
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
        className="flex justify-between items-center mb-8"
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

      {/* Tabs */}
      <div className="flex border-b-2 border-black mb-8">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-8 py-3 text-lg font-bold transition-colors relative ${
            activeTab === 'details' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Poll Details
          {activeTab === 'details' && (
             <motion.div 
               layoutId="tab-indicator"
               className="absolute bottom-0 left-0 right-0 h-[3px] bg-black translate-y-full" 
             />
          )}
        </button>
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-8 py-3 text-lg font-bold transition-colors relative ${
            activeTab === 'whitelist' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Whitelisting
          {activeTab === 'whitelist' && (
             <motion.div 
               layoutId="tab-indicator"
               className="absolute bottom-0 left-0 right-0 h-[3px] bg-black translate-y-full" 
             />
          )}
        </button>
        <button
          onClick={() => setActiveTab('registration')}
          className={`px-8 py-3 text-lg font-bold transition-colors relative ${
            activeTab === 'registration' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Registrations
          {activeTab === 'registration' && (
             <motion.div 
               layoutId="tab-indicator"
               className="absolute bottom-0 left-0 right-0 h-[3px] bg-black translate-y-full" 
             />
          )}
        </button>
        <button
          onClick={() => setActiveTab('votes')}
          className={`px-8 py-3 text-lg font-bold transition-colors relative ${
            activeTab === 'votes' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Votes
          {activeTab === 'votes' && (
             <motion.div 
               layoutId="tab-indicator"
               className="absolute bottom-0 left-0 right-0 h-[3px] bg-black translate-y-full" 
             />
          )}
        </button>
      </div>

      <div className="space-y-16 min-h-[400px]">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
        >
            {activeTab === 'details' && (
                <>
                    <section className="mb-12">
                        <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-2">
                            <h2 className="text-3xl font-serif font-bold text-gray-900">Poll Configuration</h2>
                            {maxParticipants && (
                            <span className="text-sm text-gray-500 font-medium">
                                Max Capacity: <span className="text-black font-bold">{maxParticipants.toLocaleString()}</span>
                            </span>
                            )}
                        </div>
                        <PollDetails pollId={pollId} showResults={Number(pollState) === 2} />
                    </section>

                    {pollState !== null && (
                        <section>
                            <div className="mb-6 border-b-2 border-black pb-2">
                                <h2 className="text-3xl font-serif font-bold text-gray-900">Status Management</h2>
                            </div>
                            <PollStatusManager 
                                pollId={pollId} 
                                status={Number(pollState)} 
                                onStatusChange={() => {
                                    fetchPollData()
                                }}
                            />
                        </section>
                    )}
                </>
            )}

            {activeTab === 'whitelist' && (
                <section>
                     <div className="mb-8">
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Whitelist Management</h2>
                        <p className="text-gray-600">Control who is allowed to register their ZK identity and participate.</p>
                     </div>
                     <WhitelistManager pollId={pollId} pollState={pollState} />
                     <WhitelistedAddressesList pollId={pollId} />
                </section>
            )}

            {activeTab === 'registration' && (
                <section>
                     <div className="mb-8">
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Registration Registry</h2>
                        <p className="text-gray-600">Verified ZK Identity Commitments.</p>
                     </div>
                     <RegistrationList pollId={pollId} pollState={pollState} />
                </section>
            )}

            {activeTab === 'votes' && (
                <section>
                     <div className="mb-8">
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Vote History</h2>
                        <p className="text-gray-600">Real-time ledger of all cast votes.</p>
                     </div>
                     <VotesList pollId={pollId} pollState={pollState} />
                </section>
            )}
        </motion.div>
      </div>
    </div>
  )
}
