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
    <div className="bg-white border-2 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative font-sans">
      {/* Header */}
      <div className="border-b-2 border-dashed border-gray-200 pb-6 mb-6">
        <p className="text-xs font-mono text-gray-500 uppercase mb-2">Poll Title</p>
        <h2 className="text-3xl font-bold leading-tight">{poll.title}</h2>
      </div>

      <div className="space-y-6">
         {/* Description */}
        {poll.description && (
          <div>
            <p className="text-xs font-mono text-gray-500 uppercase mb-2">Description</p>
            <p className="text-gray-800 leading-relaxed">{poll.description}</p>
          </div>
        )}

        {/* Options */}
        {poll.options && Array.isArray(poll.options) && (
          <div className="pt-6 border-t border-dashed border-gray-200">
             <p className="text-xs font-mono text-gray-500 uppercase mb-4">Options</p>
            <ul className="space-y-3">
              {poll.options.map((opt, idx) => (
                <li key={idx} className="flex justify-between items-center group">
                  <span className="font-medium text-lg px-3 py-2 bg-gray-50 flex-grow rounded-l-lg border-y border-l border-gray-100 group-hover:bg-gray-100 transition">{opt}</span>
                  {showResults && results[idx] !== undefined && (
                     <span className="font-mono font-bold bg-black text-white px-4 py-2 rounded-r-lg border border-black min-w-[3rem] text-center">
                       {Number(results[idx])}
                     </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
