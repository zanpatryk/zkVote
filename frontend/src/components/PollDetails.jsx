"use client"

import { useEffect, useState } from 'react'
import { getPollById, getPollResults } from '@/lib/blockchain/engine/read'

export default function PollDetails({ pollId, showResults = false }) {
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      if (!pollId) return
      
      try {
        const pollData = await getPollById(pollId)
        if (cancelled) return
        setPoll(pollData)

        if (showResults && pollData && pollData.options) {
             const res = await getPollResults(pollId, pollData.options.length)
             if (!cancelled) setResults(res)
        }
      } catch (error) {
        console.error('Failed to load poll data:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [pollId, showResults])

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
          <ul className="space-y-2">
            {poll.options.map((opt, idx) => (
              <li key={idx} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                <span>{opt}</span>
                {showResults && results[idx] !== undefined && (
                   <span className="font-bold bg-black text-white px-2 py-1 rounded text-sm">
                     {results[idx]} votes
                   </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
