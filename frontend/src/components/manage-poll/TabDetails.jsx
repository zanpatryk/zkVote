'use client'

import PollDetails from '@/components/PollDetails'
import PollStatusManager from '@/components/PollStatusManager.jsx'

export default function TabDetails({ pollId, pollState, maxParticipants, onStatusChange }) {
  return (
    <>
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-2">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Poll Configuration</h2>
            {maxParticipants && (
            <span className="text-sm text-gray-500 font-medium">
                Max Capacity: <span className="text-black font-bold">{maxParticipants.toLocaleString()}</span>
            </span>
            )}
        </div>
        <PollDetails pollId={pollId} showResults={Number(pollState) === 2} />
      </section>

      {pollState !== null && (
        <section>
            <div className="mb-6 border-b-2 border-black pb-2">
                <h2 className="text-3xl font-serif font-bold text-gray-900">Status Management</h2>
            </div>
            <PollStatusManager 
                pollId={pollId} 
                status={Number(pollState)} 
                onStatusChange={onStatusChange}
            />
        </section>
      )}
    </>
  )
}
