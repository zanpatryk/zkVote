import { useState, useEffect, useCallback } from 'react'
import { getWhitelistedAddresses, getModules } from '@/lib/blockchain/engine/read'
import { useBlockNumber } from 'wagmi'
import { useMultiContractEvents } from '@/hooks/useContractEvents'
import { toast } from 'react-hot-toast'

// Batch size for pagination (blocks)
const BATCH_SIZE = 5000n

// Parser for whitelist events
const parseWhitelistLog = (log) => ({
  user: log.args.user,
  transactionHash: log.transactionHash,
  blockNumber: log.blockNumber,
})

/**
 * Hook to manage whitelisted addresses with pagination and real-time updates
 * @param {string} pollId - The ID of the poll
 * @returns {Object} - { addresses, loading, hasMore, loadMore, lastScannedBlock }
 */
export function useWhitelistedAddresses(pollId) {
  const { data: currentBlock } = useBlockNumber()
  const [addresses, setAddresses] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [lastInternalBlock, setLastInternalBlock] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [eligibilityModuleAddress, setEligibilityModuleAddress] = useState(null)

  // Fetch Eligibility Module Address
  useEffect(() => {
    const fetchModule = async () => {
        if (!pollId) return
        try {
            const { eligibilityModule } = await getModules(pollId)
            setEligibilityModuleAddress(eligibilityModule)
        } catch (error) {
            console.error('Failed to fetch eligibility module:', error)
        }
    }
    fetchModule()
  }, [pollId])

  // Real-time event listeners
  const { events: liveWhitelisted } = useMultiContractEvents({
    address: eligibilityModuleAddress,
    eventConfigs: [
      {
        eventSignature: 'event Whitelisted(address indexed user, uint256 indexed pollId)',
        eventName: 'Whitelisted',
        args: { pollId: BigInt(pollId || 0) },
      },
      {
        eventSignature: 'event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)',
        eventName: 'EligibilityModuleV0__AddressWhitelisted',
        args: { pollId: BigInt(pollId || 0) },
      },
    ],
    enabled: !!eligibilityModuleAddress && !!pollId,
    parseLog: parseWhitelistLog,
  })

  // Merge live events with addresses
  // Merge live events with addresses
  useEffect(() => {
    if (liveWhitelisted.length > 0) {
      let hasNew = false
      // We must track if we actually add anything to avoid infinite loops if addresses strictly depends on this
      // But since we check existence first, it should be fine.
      const next = new Set(addresses)
      
      liveWhitelisted.forEach(e => {
        if (!next.has(e.user)) {
          next.add(e.user)
          hasNew = true
        }
      })

      if (hasNew) {
        setAddresses(next)
        toast.success('New address whitelisted!')
      }
    }
  }, [liveWhitelisted, addresses])

  // Initialize on first load when block number is available
  useEffect(() => {
    if (currentBlock && lastInternalBlock === null) {
      loadMore(currentBlock)
    }
  }, [currentBlock])

  const loadMore = useCallback(async (startScanBlock) => {
    if (!pollId || loading) return
    
    // Determine range
    // If startScanBlock is provided (initial load), use it. 
    // Otherwise use lastInternalBlock - 1
    const endBlock = startScanBlock ? startScanBlock : (lastInternalBlock ? lastInternalBlock - 1n : null)
    
    if (!endBlock || endBlock <= 0n) {
        setHasMore(false)
        return
    }

    const startBlock = endBlock - BATCH_SIZE > 0n ? endBlock - BATCH_SIZE : 0n

    setLoading(true)
    try {
      const newAddresses = await getWhitelistedAddresses(pollId, startBlock, endBlock)
      
      setAddresses(prev => {
        const next = new Set(prev)
        newAddresses.forEach(addr => next.add(addr))
        return next
      })

      setLastInternalBlock(startBlock)
      
      // If we reached genesis, no more data
      if (startBlock === 0n) {
          setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load whitelisted addresses:', err)
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [pollId, lastInternalBlock, loading])

  return {
    addresses,
    loading,
    hasMore,
    loadMore,
    lastScannedBlock: lastInternalBlock,
  }
}
