import { useState, useEffect, useCallback } from 'react'
import { getWhitelistedAddresses, getModules } from '@/lib/blockchain/engine/read'
import { useBlockNumber, useChainId } from 'wagmi'
import { useMultiContractEvents } from '@/hooks/useContractEvents'
import { toast } from 'react-hot-toast'

// Batch size for pagination (blocks)
const BATCH_SIZE = 900n

/**
 * Hook to manage whitelisted addresses with pagination and real-time updates
 * @param {string} pollId - The ID of the poll
 * @returns {Object} - { addresses, loading, hasMore, loadMore, lastScannedBlock }
 */
export function useWhitelistedAddresses(pollId) {
  const chainId = useChainId()
  const { data: currentBlock } = useBlockNumber()
  const [addresses, setAddresses] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [lastInternalBlock, setLastInternalBlock] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [eligibilityModuleAddress, setEligibilityModuleAddress] = useState(null)

  // Reset state when chain changes
  useEffect(() => {
    setAddresses(new Set())
    setLastInternalBlock(null)
    setHasMore(true)
    setEligibilityModuleAddress(null)
  }, [chainId])

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
  }, [pollId, chainId])

  // Robust event parser with JS-side pollId filtering
  const parseLog = useCallback((log) => {
    const user = log.args?.user
    const logPollId = log.args?.pollId
    if (!user) return null
    
    // Filter by pollId in JS to bypass RPC filtering inconsistencies
    if (logPollId !== undefined && logPollId !== null) {
      if (logPollId.toString() !== pollId?.toString()) return null
    }
    
    return {
      user: user.toLowerCase(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
    }
  }, [pollId])

  // Real-time event listeners
  const { events: liveWhitelisted } = useMultiContractEvents({
    address: eligibilityModuleAddress,
    eventConfigs: [
      {
        eventSignature: 'event Whitelisted(address indexed user, uint256 indexed pollId)',
        eventName: 'Whitelisted',
        // args intentionally omitted for JS-side filtering robustness
      },
      {
        eventSignature: 'event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)',
        eventName: 'EligibilityModuleV0__AddressWhitelisted',
      },
    ],
    enabled: !!eligibilityModuleAddress && !!pollId,
    parseLog,
  })

  // Merge live events with addresses
  useEffect(() => {
    if (liveWhitelisted.length > 0) {
      setAddresses(prev => {
        const next = new Set(prev)
        let hasNew = false
        
        liveWhitelisted.forEach(e => {
          const addr = e.user?.toLowerCase()
          if (addr && !next.has(addr)) {
            next.add(addr)
            hasNew = true
          }
        })

        if (!hasNew) return prev
        // Note: Success toast for manual action is handled in addToWhitelist,
        // but this effect ensures real-time updates for everyone else too.
        return next
      })
    }
  }, [liveWhitelisted])
    
  const loadMore = useCallback(async (startScanBlock) => {
    if (!pollId || loading) return
    
    // Determine range
    const endBlock = startScanBlock ? startScanBlock : (lastInternalBlock ? lastInternalBlock - 1n : null)
    
    if (endBlock === null || endBlock <= 0n) {
        if (endBlock !== null) setHasMore(false)
        return
    }

    const startBlock = endBlock - BATCH_SIZE > 0n ? endBlock - BATCH_SIZE : 0n

    setLoading(true)
    try {
      const { data: newAddresses, error } = await getWhitelistedAddresses(pollId, startBlock, endBlock)
      if (error) throw new Error(error)
      
      if (newAddresses && newAddresses.length > 0) {
        setAddresses(prev => {
          const next = new Set(prev)
          newAddresses.forEach(addr => {
            if (addr) next.add(addr.toLowerCase())
          })
          return next
        })
      }

      setLastInternalBlock(startBlock)
      
      // If we reached genesis, or we scanned the whole range (if we know the deployment start), no more data
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

  // Initial load when both pollId and currentBlock are available
  useEffect(() => {
    if (currentBlock && pollId && lastInternalBlock === null && !loading) {
      loadMore(currentBlock)
    }
  }, [currentBlock, pollId, lastInternalBlock, loading, loadMore])

  // Mutation: Add to Whitelist
  const addToWhitelist = useCallback(async (addressesToAdd) => {
    const toastId = toast.loading('Whitelisting users...')
    try {
        // Dynamic import to avoid circular dependencies if any, though regular import is fine here
        const { whitelistUsers } = await import('@/lib/blockchain/engine/members')
        
        await whitelistUsers(pollId, addressesToAdd)
        toast.success('Addresses whitelisted successfully!', { id: toastId })
        // We don't need to manually update state here because the event listener will catch it
        // and update the 'addresses' list automatically + show a success toast for the event.
    } catch (error) {
        console.error('Failed to whitelist addresses:', error)
        const { formatTransactionError } = await import('@/lib/blockchain/utils/error-handler')
        toast.error(formatTransactionError(error, 'Failed to whitelist addresses'), { id: toastId })
        throw error
    }
  }, [pollId])

  return {
    addresses,
    loading,
    hasMore,
    loadMore,
    lastScannedBlock: lastInternalBlock,
    addToWhitelist
  }
}
