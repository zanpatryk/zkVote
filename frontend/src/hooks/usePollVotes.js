import { useState, useEffect } from 'react'
import { getPollVotes, getModules } from '@/lib/blockchain/engine/read'
import { useContractEvents } from '@/hooks/useContractEvents'
import { POLL_STATE } from '@/lib/constants'

// Parser for VoteCasted events
const parseVoteLog = (log) => ({
  voter: log.args.voter, // internal ID
  voteId: log.args.voteId.toString(),
  transactionHash: log.transactionHash,
  blockNumber: log.blockNumber,
})

/**
 * Hook to manage poll votes with real-time updates
 * @param {string} pollId - The ID of the poll
 * @param {number} pollState - Current state of the poll
 * @returns {Object} - { votes, loading }
 */
export function usePollVotes(pollId, pollState) {
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [voteStorageAddress, setVoteStorageAddress] = useState(null)

  // Fetch contract address
  useEffect(() => {
    const fetchAddress = async () => {
      if (!pollId) return
      try {
        const { voteStorage } = await getModules(pollId)
        setVoteStorageAddress(voteStorage)
      } catch (error) {
        console.error('Failed to get vote storage address:', error)
      }
    }
    fetchAddress()
  }, [pollId])

  // Fetch initial votes
  useEffect(() => {
    const fetchVotes = async () => {
      if (!pollId) return
      setLoading(true)
      try {
        const { data: history, error } = await getPollVotes(pollId)
        if (error) throw new Error(error)
        // Sort by block number descending (newest first)
        setVotes((history || []).sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber)))
      } catch (error) {
        console.error('Failed to fetch votes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVotes()
  }, [pollId])

  // Watch for new votes
  const { events: liveVotes } = useContractEvents({
    address: voteStorageAddress,
    eventSignature: 'event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)',
    eventName: 'VoteCasted',
    args: { pollId: BigInt(pollId || 0) },
    enabled: pollState === POLL_STATE.ACTIVE,
    parseLog: parseVoteLog,
  })

  // Merge live votes with initial data
  useEffect(() => {
    const processLiveVotes = async () => {
      if (liveVotes.length === 0) return

      try {
        const { getPublicClient } = await import('@wagmi/core')
        const { wagmiConfig } = await import('@/lib/wagmi/config')
        const publicClient = getPublicClient(wagmiConfig)

        const processed = await Promise.all(liveVotes.map(async v => {
          try {
            const tx = await publicClient.getTransaction({ hash: v.transactionHash })
            return { ...v, voter: tx.from } // Override with real sender
          } catch (e) {
            console.error('Failed to resolve live vote sender:', e)
            return v
          }
        }))

        setVotes(prev => {
          const existingTxHashes = new Set(prev.map(v => v.transactionHash))
          const uniqueNewVotes = processed.filter(v => !existingTxHashes.has(v.transactionHash))
          if (uniqueNewVotes.length === 0) return prev
          return [...uniqueNewVotes, ...prev].sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
        })
      } catch (err) {
        console.error('Error processing live votes:', err)
      }
    }

    processLiveVotes()
  }, [liveVotes])

  return { votes, loading }
}
