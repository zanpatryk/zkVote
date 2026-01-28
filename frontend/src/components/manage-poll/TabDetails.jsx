'use client'

import PollDetails from '@/components/PollDetails'
import PollFundingManager from '@/components/PollFundingManager.jsx'
import PollStatusManager from '@/components/PollStatusManager.jsx'

export default function TabDetails({ pollId, pollState, maxParticipants, onStatusChange, isZk, isSecret }) {
  return (
    <>
      <section className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b-2 border-black pb-2 gap-2 md:gap-0">
          <h2 className="text-3xl font-serif font-bold text-gray-900">Poll Configuration</h2>
          {maxParticipants && (
            <span className="text-sm text-gray-500 font-medium pb-1">
              Max Capacity: <span className="text-black font-bold">{maxParticipants.toLocaleString()}</span>
            </span>
          )}
        </div>
        <PollDetails pollId={pollId} showResults={Number(pollState) === 2} />
      </section>

      {(!isZk && !isSecret) && (
      <section className="mb-12">
        <div className="mb-6 border-b-2 border-black pb-2">
          <h2 className="text-3xl font-serif font-bold text-gray-900">Poll Funding</h2>
        </div>
        <PollFundingManager pollId={pollId} status={Number(pollState)} />
      </section>
      )}

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

