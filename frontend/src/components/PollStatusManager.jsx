import { POLL_STATE } from '@/lib/constants'
import { useRouter } from 'next/navigation'
import { usePollManagement } from '@/hooks/usePollManagement'

export default function PollStatusManager({ pollId, status, onStatusChange }) {
  const { startPoll: hookStartPoll, endPoll: hookEndPoll, isStarting, isEnding } = usePollManagement()
  const router = useRouter() // Keep router if it's still used for refresh

  const handleStart = async () => {
    if (!confirm('Are you sure you want to start this poll? Users will be able to vote.')) return

    try {
      await hookStartPoll(pollId)
      if (onStatusChange) onStatusChange()
      router.refresh()
    } catch (error) {
      console.error('Failed to start poll:', error)
    }
  }

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this poll? No more votes will be accepted.')) return

    try {
      await hookEndPoll(pollId)
      if (onStatusChange) onStatusChange()
      router.refresh()
    } catch (error) {
      console.error('Failed to end poll:', error)
    }
  }

  if (status === POLL_STATE.ENDED) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-black border-dashed">
        <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
            <h3 className="text-xl font-serif font-bold text-gray-700">Poll Status: ENDED</h3>
        </div>
        <p className="text-gray-600 mt-2 pl-6">This poll has ended. No further actions are available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-2xl font-serif font-bold mb-6">Poll Status</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
             <span className={`w-4 h-4 rounded-full ${status === POLL_STATE.CREATED ? 'bg-blue-500' : 'bg-green-500'} border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}></span>
             <div>
                <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Current Status</p>
                <p className="text-xl font-bold text-black border-b-2 border-black/10">
                    {status === POLL_STATE.CREATED ? 'CREATED' : 'ACTIVE'}
                </p>
             </div>
        </div>

        {status === POLL_STATE.CREATED && (
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px]"
          >
            {isStarting ? 'Starting...' : 'Start Poll'}
          </button>
        )}

        {status === POLL_STATE.ACTIVE && (
          <button
            onClick={handleEnd}
            disabled={isEnding}
            className="px-6 py-3 border-2 border-black bg-white text-black rounded-lg hover:bg-red-50 disabled:opacity-50 transition font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
          >
            {isEnding ? 'Ending...' : 'End Poll'}
          </button>
        )}
      </div>
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 flex gap-3">
        <p className="leading-relaxed">
           {status === POLL_STATE.CREATED 
          ? 'Once started, whitelisted users will be able to cast their votes. The poll cannot be modified after starting.'
          : 'Ending the poll will close voting permanently. Results will be finalized and can be minted as NFTs.'}
        </p>
      </div>
    </div>
  )
}
