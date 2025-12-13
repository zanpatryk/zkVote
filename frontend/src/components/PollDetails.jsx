"use client"

import { useEffect, useState } from 'react'
import { getPollById } from '@/lib/blockchain/engine/read'

export default function PollDetails({ pollId }) {
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPoll() {
      if (!pollId) return
      
      try {
        const data = await getPollById(pollId)
        if (!cancelled) setPoll(data)
      } catch (error) {
        console.error('Failed to load poll:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPoll()

    return () => {
      cancelled = true
    }
  }, [pollId])

  if (loading) {
    return <p className="text-gray-600">Loading poll data...</p>
  }

  if (!poll) {
    return <p className="text-red-600">Poll data could not be loaded.</p>
  }

  return (
    <div className="mb-10 bg-white border-2 border-black rounded-2xl p-6 shadow-sm space-y-2">
      <h2 className="text-2xl font-semibold">{poll.title}</h2>
      {poll.description && (
        <p className="text-gray-700">{poll.description}</p>
      )}
      {poll.options && Array.isArray(poll.options) && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Options</h3>
          <ul className="list-disc list-inside space-y-1">
            {poll.options.map((opt, idx) => (
              <li key={idx}>{opt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
