import { useState } from 'react'
import { startPoll, endPoll } from '@/lib/blockchain/engine/write'
import { useRouter } from 'next/navigation'

export default function PollStatusManager({ pollId, status, onStatusChange }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStart = async () => {
    if (!confirm('Are you sure you want to start this poll? Users will be able to vote.')) return
    
    setLoading(true)
    try {
      await startPoll(pollId)
      if (onStatusChange) onStatusChange()
      router.refresh()
    } catch (error) {
      console.error('Failed to start poll:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this poll? No more votes will be accepted.')) return

    setLoading(true)
    try {
      await endPoll(pollId)
      if (onStatusChange) onStatusChange()
      router.refresh()
    } catch (error) {
      console.error('Failed to end poll:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 2) {
    return (
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Poll Status</h3>
        <p className="text-gray-500">This poll has ended. No further actions are available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Poll Status Management</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Current Status</p>
          <p className="text-lg font-medium text-black">
            {status === 0 ? 'Created' : 'Active'}
          </p>
        </div>

        {status === 0 && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Starting...' : 'Start Poll'}
          </button>
        )}

        {status === 1 && (
          <button
            onClick={handleEnd}
            disabled={loading}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Ending...' : 'End Poll'}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-4">
        {status === 0 
          ? 'Once started, whitelisted users will be able to cast their votes.'
          : 'Ending the poll will prevent any further voting. This action cannot be undone.'}
      </p>
    </div>
  )
}
