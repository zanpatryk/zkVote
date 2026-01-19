'use client'

import VotesList from '@/components/VotesList'

export default function TabVotes({ pollId, pollState }) {
  return (
    <section>
         <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Vote History</h2>
            <p className="text-gray-600">Real-time ledger of all cast votes.</p>
         </div>
         <VotesList pollId={pollId} pollState={pollState} />
    </section>
  )
}
