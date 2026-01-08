'use client'

import { useState, useEffect, useCallback } from 'react'
import { getWhitelistedAddresses } from '@/lib/blockchain/engine/read'
import { useBlockNumber, useReadContract, useWatchContractEvent } from 'wagmi'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import SemaphoreEligibilityModuleABI from '@/lib/contracts/abis/SemaphoreEligibilityModule.json'

// Batch size for pagination (blocks)
const BATCH_SIZE = 5000n

export default function WhitelistedAddressesList({ pollId }) {
  const { data: currentBlock } = useBlockNumber()
  const [addresses, setAddresses] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [lastInternalBlock, setLastInternalBlock] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  // Fetch Eligibility Module Address
  const { data: eligibilityModuleAddress } = useReadContract({
    address: votingSystemContract.address,
    abi: votingSystemContract.abi,
    functionName: 's_eligibilityModule',
  })

  // Real-time Event Listener
  useWatchContractEvent({
    address: eligibilityModuleAddress,
    abi: SemaphoreEligibilityModuleABI,
    eventName: 'Whitelisted',
    args: { pollId: BigInt(pollId || 0) }, // Ensure pollId is valid
    onLogs(logs) {
      if (!logs || logs.length === 0) return

      const newAddrs = logs.map(l => l.args.user)
      if (newAddrs.length > 0) {
        setAddresses(prev => {
          const next = new Set(prev)
          newAddrs.forEach(addr => next.add(addr))
          return next
        })
        toast.success('New address whitelisted!')
      }
    },
    enabled: !!eligibilityModuleAddress && !!pollId 
  })

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

  const addressList = Array.from(addresses)

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-black font-serif mb-6 flex items-center gap-4">
        Whitelisted Addresses
        <span className="text-sm bg-black text-white px-3 py-1 rounded-full font-mono">
          {addressList.length}
        </span>
      </h2>

      <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {addressList.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500 italic">
                No addresses whitelisted yet in the scanned range.
            </div>
        ) : (
            <div className="divide-y-2 divide-black max-h-[400px] overflow-y-auto">
                {addressList.map((addr) => (
                    <div key={addr} className="p-4 font-mono text-sm hover:bg-gray-50 transition-colors flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {addr}
                    </div>
                ))}
            </div>
        )}
        
        {/* Footer / Pagination */}
        <div className="p-4 border-t-2 border-black bg-gray-50 flex justify-between items-center">
            <div className="text-xs text-gray-500 font-mono">
                Scanned until block: {lastInternalBlock?.toString() || '...'}
            </div>
            
            {hasMore && (
                <button 
                  onClick={() => loadMore()} 
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white text-sm font-bold rounded hover:bg-gray-800 disabled:opacity-50 transition"
                >
                    {loading ? 'Scanning...' : 'Load More History'}
                </button>
            )}
        </div>
      </div>
    </div>
  )
}
