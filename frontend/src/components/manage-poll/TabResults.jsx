'use client'

import TallyManager from '@/components/TallyManager'

export default function TabResults({ pollId, pollState, isSecret }) {
  return (
    <section>
         <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Tally & Results</h2>
            <p className="text-gray-600">Decrypt and publish final election results.</p>
         </div>
         <TallyManager pollId={pollId} pollState={pollState} isSecret={isSecret} />
    </section>
  )
}
