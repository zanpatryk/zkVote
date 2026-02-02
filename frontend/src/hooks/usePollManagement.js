import { startPoll, endPoll } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'
import { useState } from 'react'

/**
 * Hook to manage poll lifecycle (start/end) with toast notifications.
 */
export function usePollManagement() {
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const handleStartPoll = async (pollId, onSuccess) => {
    setIsStarting(true)
    const toastId = toast.loading('Starting poll...')

    try {
      await startPoll(pollId)
      toast.success('Poll started successfully!', { id: toastId })
      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 2000))
      await onSuccess?.()
    } catch (error) {
      console.error('Failed to start poll:', error)
      toast.error(formatTransactionError(error, 'Failed to start poll'), { id: toastId })
    } finally {
      setIsStarting(false)
    }
  }

  const handleEndPoll = async (pollId, onSuccess) => {
    setIsEnding(true)
    const toastId = toast.loading('Ending poll...')

    try {
      await endPoll(pollId)
      toast.success('Poll ended successfully!', { id: toastId })
      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 2000))
      await onSuccess?.()
    } catch (error) {
      console.error('Failed to end poll:', error)
      toast.error(formatTransactionError(error, 'Failed to end poll'), { id: toastId })
    } finally {
      setIsEnding(false)
    }
  }

  return {
    startPoll: handleStartPoll,
    endPoll: handleEndPoll,
    isStarting,
    isEnding
  }
}
