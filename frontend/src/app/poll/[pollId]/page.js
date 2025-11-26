"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getPollById } from '@/lib/blockchain/read'

export default function ManagePoll() {
  const { pollId } = useParams()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPoll() {
      try {
        const data = await getPollById(pollId)
        if (!cancelled) setPoll(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPoll()

    return () => {
      cancelled = true
    }
  }, [pollId])



  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <h1 className="text-4xl font-bold mb-4">Poll Details</h1>

      {loading ? (
        <p className="text-gray-600">Loading poll data...</p>
      ) : !poll ? (
        <p className="text-red-600">Poll data could not be loaded.</p>
      ) : (
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
      )}


    </div>
  )
}