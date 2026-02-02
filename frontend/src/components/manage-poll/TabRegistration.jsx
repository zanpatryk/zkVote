'use client'

import RegistrationList from '@/components/RegistrationList'

export default function TabRegistration({ pollId, pollState }) {
  return (
    <section>
         <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Registration Registry</h2>
            <p className="text-gray-600">Verified ZK Identity Commitments.</p>
         </div>
         <RegistrationList pollId={pollId} pollState={pollState} />
    </section>
  )
}
