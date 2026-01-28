'use client'

import { useState, useCallback } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { parseAbiItem } from 'viem'

/**
 * Generic hook for watching contract events with automatic deduplication and sorting.
 * 
 * @param {Object} options
 * @param {string} options.address - Contract address to watch
 * @param {string} options.eventSignature - Full event signature string (e.g., 'event Transfer(address indexed from, address indexed to, uint256 value)')
 * @param {string} options.eventName - Event name for wagmi
 * @param {Object} options.args - Event filter args
 * @param {boolean} options.enabled - Whether to enable watching
 * @param {Function} options.parseLog - Function to parse a log into your desired format. Must return object with transactionHash and blockNumber.
 * @param {Array} options.initialEvents - Initial events to populate the list
 * @returns {{ events: Array, setEvents: Function }}
 */
export function useContractEvents({
  address,
  eventSignature,
  eventName,
  args = {},
  enabled = true,
  parseLog,
  initialEvents = [],
}) {
  const [events, setEvents] = useState(initialEvents)

  const handleLogs = useCallback((logs) => {
    if (!logs?.length) return

    const parsed = logs.map(log => {
      try {
        return parseLog(log)
      } catch (e) {
        console.error('Failed to parse log:', e)
        return null
      }
    }).filter(Boolean)

    setEvents(prev => {
      // Deduplicate by transaction hash
      const existingHashes = new Set(prev.map(e => e.transactionHash))
      const unique = parsed.filter(e => !existingHashes.has(e.transactionHash))
      
      if (unique.length === 0) return prev
      
      // Merge and sort by block number (newest first)
      return [...unique, ...prev].sort((a, b) => 
        Number(b.blockNumber || 0) - Number(a.blockNumber || 0)
      )
    })
  }, [parseLog])

  useWatchContractEvent({
    address,
    abi: [parseAbiItem(eventSignature)],
    eventName,
    args,
    onLogs: handleLogs,
    enabled: !!address && enabled,
  })

  return { events, setEvents }
}

/**
 * Hook for watching multiple event signatures on the same contract.
 * Useful when the same event has different names across contract versions.
 */
export function useMultiContractEvents({
  address,
  eventConfigs, // [{ eventSignature, eventName, args }]
  enabled = true,
  parseLog,
  initialEvents = [],
}) {
  const [events, setEvents] = useState(initialEvents)

  const handleLogs = useCallback((logs) => {
    if (!logs?.length) return

    const parsed = logs.map(log => {
      try {
        return parseLog(log)
      } catch (e) {
        console.error('Failed to parse log:', e)
        return null
      }
    }).filter(Boolean)

    setEvents(prev => {
      const existingHashes = new Set(prev.map(e => e.transactionHash))
      const unique = parsed.filter(e => !existingHashes.has(e.transactionHash))
      
      if (unique.length === 0) return prev
      
      return [...unique, ...prev].sort((a, b) => 
        Number(b.blockNumber || 0) - Number(a.blockNumber || 0)
      )
    })
  }, [parseLog])

  // Unrolled watchers to follow Rules of Hooks (max 2 for now as needed by zkVote)
  const config0 = eventConfigs[0]
  useWatchContractEvent({
    address,
    abi: config0 ? [parseAbiItem(config0.eventSignature)] : [],
    eventName: config0?.eventName,
    args: config0?.args || {},
    onLogs: handleLogs,
    enabled: !!address && !!config0 && enabled,
  })

  const config1 = eventConfigs[1]
  useWatchContractEvent({
    address,
    abi: config1 ? [parseAbiItem(config1.eventSignature)] : [],
    eventName: config1?.eventName,
    args: config1?.args || {},
    onLogs: handleLogs,
    enabled: !!address && !!config1 && enabled,
  })

  return { events, setEvents }
}
