import { useState, useEffect } from 'react'
import { getGroupMembers, getModules, getMemberAddedEventSignature, parseMemberAddedLog } from '@/lib/blockchain/engine/read'
import { useContractEvents } from '@/hooks/useContractEvents'
import { POLL_STATE } from '@/lib/constants'

/**
 * Hook to manage poll registrations with real-time updates
 * @param {string} pollId - The ID of the poll
 * @param {number} pollState - Current state of the poll
 * @returns {Object} - { registrations, loading, error }
 */
export function usePollRegistrations(pollId, pollState) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [eligibilityModuleAddress, setEligibilityModuleAddress] = useState(null)

  // Fetch initial data
  useEffect(() => {
    let mounted = true
    
    async function loadData() {
      if (!pollId) return
      
      try {
        setLoading(true)
        const { data: members, error } = await getGroupMembers(pollId)
        if (error) throw new Error(error)
        
        if (mounted) {
            // Sort by block number descending (newest first)
            const sorted = (members || []).sort((a, b) => Number(b.blockNumber || 0) - Number(a.blockNumber || 0))
            setRegistrations(sorted)
        }

        const modules = await getModules(pollId)
        if (mounted) setEligibilityModuleAddress(modules.eligibilityModule)

      } catch (err) {
        console.error('Failed to load registrations:', err)
        if (mounted) setError('Failed to load registrations')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => { mounted = false }
  }, [pollId])

  // Real-time updates
  const { events: liveRegistrations } = useContractEvents({
    address: eligibilityModuleAddress,
    eventSignature: getMemberAddedEventSignature(),
    eventName: 'MemberAdded',
    args: { groupId: pollId ? BigInt(pollId) : undefined },
    enabled: pollState === POLL_STATE.CREATED,
    parseLog: parseMemberAddedLog,
  })

  // Merge live events with initial data
  useEffect(() => {
    if (liveRegistrations.length > 0) {
      setRegistrations(prev => {
        const existingHashes = new Set(prev.map(r => r.transactionHash))
        const unique = liveRegistrations.filter(r => !existingHashes.has(r.transactionHash))
        if (unique.length === 0) return prev
        return [...unique, ...prev].sort((a, b) => Number(b.blockNumber || 0) - Number(a.blockNumber || 0))
      })
    }
  }, [liveRegistrations])

  return { registrations, loading, error }
}
