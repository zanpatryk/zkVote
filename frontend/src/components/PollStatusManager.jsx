import { useState } from 'react'
import { POLL_STATE } from '@/lib/constants'
import { usePollManagement } from '@/hooks/usePollManagement'

export default function PollStatusManager({ pollId, status, onStatusChange }) {
  const { startPoll: hookStartPoll, endPoll: hookEndPoll, isStarting, isEnding } = usePollManagement()
  const [modalOpen, setModalOpen] = useState(false)
  const [actionType, setActionType] = useState(null) // 'start' | 'end'

  const openModal = (type) => {
    setActionType(type)
    setModalOpen(true)
  }

  const handleConfirm = async () => {
    if (actionType === 'start') {
      await hookStartPoll(pollId, onStatusChange)
    } else if (actionType === 'end') {
      await hookEndPoll(pollId, onStatusChange)
    }
    setModalOpen(false)
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
    <div className="bg-white p-8 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
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
            onClick={() => openModal('start')}
            disabled={isStarting}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px]"
          >
            {isStarting ? 'Starting...' : 'Start Poll'}
          </button>
        )}

        {status === POLL_STATE.ACTIVE && (
          <button
            onClick={() => openModal('end')}
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

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-6 mx-4 relative animate-in fade-in zoom-in duration-200">
            <h4 className="text-xl font-serif font-bold mb-4">
              {actionType === 'start' ? 'Start Voting?' : 'End Voting?'}
            </h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {actionType === 'start' 
                ? 'Are you sure you want to start this poll? Once started, registered users will be allowed to vote immediately.'
                : 'Are you sure you want to end this poll? This action cannot be undone and no further votes will be accepted.'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border-2 border-black bg-white hover:bg-gray-100 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isStarting || isEnding}
                className={`px-5 py-2 text-sm rounded-lg text-white font-bold transition disabled:opacity-50 ${
                  actionType === 'start' ? 'bg-black hover:bg-gray-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'start' 
                  ? (isStarting ? 'Starting...' : 'Confirm Start')
                  : (isEnding ? 'Ending...' : 'End Poll Now')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
