'use client'

import WhitelistManager from '@/components/WhitelistManager'
import WhitelistedAddressesList from '@/components/WhitelistedAddressesList'

export default function TabWhitelist({ pollId, pollState }) {
  return (
    <section>
       <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Whitelist Management</h2>
          <p className="text-gray-600">Control who is allowed to participate in this poll.</p>
       </div>
       <WhitelistManager pollId={pollId} pollState={pollState} />
       <WhitelistedAddressesList pollId={pollId} />
    </section>
  )
}
