"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, getMerkleTreeDepth, getModules } from '@/lib/blockchain/engine/read'
import { getAddresses } from '@/lib/contracts'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { getAccount } from '@wagmi/core'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import PollManageTabs from '@/components/manage-poll/PollManageTabs'
import TabDetails from '@/components/manage-poll/TabDetails'
import TabWhitelist from '@/components/manage-poll/TabWhitelist'
import TabRegistration from '@/components/manage-poll/TabRegistration'
import TabVotes from '@/components/manage-poll/TabVotes'
import TabResults from '@/components/manage-poll/TabResults'
import BackButton from '@/components/BackButton'

export default function ManagePollPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()
  const [isOwner, setIsOwner] = useState(false)
  const [pollState, setPollState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [merkleDepth, setMerkleDepth] = useState(0)
  const [maxParticipants, setMaxParticipants] = useState(null)
  const [isSecret, setIsSecret] = useState(false)
  const [isZK, setIsZK] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const fetchPollData = async () => {
    if (!isConnected || !userAddress || !pollId) {
      setLoading(false)
      return
    }

    try {
      const { data: poll, error: pollError } = await getPollById(pollId)
      if (pollError) throw new Error(pollError)
      
      if (poll && poll.creator.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true)
        setPollState(poll.state) 

        // Check Modules
        const { eligibilityModule, voteStorage } = await getModules(pollId)
        const account = getAccount(config)
        const addresses = getAddresses(account?.chainId)

        // Check Anonymity (ZK)
        if (eligibilityModule && eligibilityModule.toLowerCase() === addresses.semaphoreEligibility.toLowerCase()) {
            setIsZK(true)
            const { data: depth } = await getMerkleTreeDepth(pollId)
            setMerkleDepth(depth)
            setMaxParticipants(Math.pow(2, depth))
        } else {
            setIsZK(false)
            setMerkleDepth(0)
            setMaxParticipants(null)
        }

        // Check Secrecy
        if (voteStorage && voteStorage.toLowerCase() === addresses.zkElGamalVoteVector.toLowerCase()) {
            setIsSecret(true)
        } else {
            setIsSecret(false)
        }
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
        className="mb-8 md:mb-12 flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6 md:gap-0"
      >
        <div>
           <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-2">Manage Poll</h1>
           <p className="text-gray-500 text-lg">Admin control panel.</p>
        </div>
        <div className="w-full md:w-auto flex justify-end">
          <BackButton href="/poll" label="Back to Polls" />
        </div>
      </motion.div>

      <PollManageTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isZK={isZK}
        isSecret={isSecret}
      />

      <div className="space-y-16 min-h-[400px]">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
        >
            {activeTab === 'details' && (
              <TabDetails 
                pollId={pollId} 
                pollState={pollState} 
                maxParticipants={maxParticipants}
                onStatusChange={fetchPollData} 
                isZK={isZK}
                isSecret={isSecret}
              />
            )}

            {activeTab === 'whitelist' && (
              <TabWhitelist pollId={pollId} pollState={pollState} />
            )}

            {activeTab === 'registration' && (
              <TabRegistration pollId={pollId} pollState={pollState} />
            )}

            {activeTab === 'votes' && (
              <TabVotes pollId={pollId} pollState={pollState} />
            )}

            {activeTab === 'results' && (
              <TabResults 
                pollId={pollId} 
                pollState={pollState} 
                isSecret={isSecret}
              />
            )}
        </motion.div>
      </div>
    </div>
  )
}
