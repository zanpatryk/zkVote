"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { hexToString } from 'viem'
import { toast } from 'react-hot-toast'

function formatDuration(ms) {
  if (ms <= 0) return '0m'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600) % 24
  const days = Math.floor(totalSeconds / 86400)

  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes || parts.length === 0) parts.push(`${minutes}m`)
  return parts.join(' ')
}

export default function PollCard({ pollId, rawData, isOwner = false, showVoteButton = false }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  let title = `Poll #${pollId}`
  let startTime = null
  let endTime = null

  try {
    const decoded = JSON.parse(hexToString(rawData))
    title = decoded.title || decoded.name || title
    if (decoded.startTime) startTime = Number(decoded.startTime)
    if (decoded.endTime) endTime = Number(decoded.endTime)
  } catch {}

  let statusLabel = null
  let statusValue = null

  if (startTime && now < startTime) {
    statusLabel = 'Starts in'
    statusValue = formatDuration(startTime - now)
  } else if (endTime && now < endTime) {
    statusLabel = 'Ends in'
    statusValue = formatDuration(endTime - now)
  } else if (endTime && now >= endTime) {
    statusLabel = 'Ended'
    statusValue = formatDuration(now - endTime) + ' ago'
  }

  const handleCopy = (e) => {
    e.preventDefault()
    navigator.clipboard.writeText(pollId.toString())
    toast.success('Poll ID copied!')
  }

  return (
    <div className="p-8 bg-gray-50 border border-gray-300 rounded-2xl hover:bg-gray-100 hover:border-gray-500 transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">
            {title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-gray-600">
            <p title={pollId.toString()}>
              Poll ID: 0x{pollId.toString().slice(0, 4)}...{pollId.toString().slice(-4)}
            </p>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
              title="Copy Poll ID"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
            </button>
          </div>
          {statusLabel && statusValue && (
            <p className="mt-1 text-sm text-gray-500">
              {statusLabel}: <span className="font-medium">{statusValue}</span>
            </p>
          )}
        </div>
        {isOwner && (
          <span className="bg-black text-white text-xs px-3 py-1 rounded-full">
            OWNER
          </span>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <Link href={`/poll/${pollId}`}>
          <span className="text-blue-600 font-medium hover:underline">
            View Details →
          </span>
        </Link>

        {isOwner && (
          <Link href={`/poll/${pollId}/whitelist`}>
            <span className="text-green-600 font-medium hover:underline">
              Whitelist users →
            </span>
          </Link>
        )}

        {showVoteButton && startTime && endTime && now >= startTime && now < endTime && (
          <Link href={`/poll/${pollId}/vote`}>
            <span className="text-indigo-600 font-medium hover:underline">
              Vote →
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}