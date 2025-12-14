"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { hexToString } from 'viem'
import { toast } from 'react-hot-toast'

export function formatDuration(ms) {
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

export default function PollCard({ pollId, title, state, isOwner = false, showVoteButton = false }) {
  const [now, setNow] = useState(Date.now())

  // State mapping: 0 = CREATED, 1 = ACTIVE, 2 = ENDED
  let statusLabel = null
  let statusValue = null

  if (state === 0) {
    statusLabel = 'Status'
    statusValue = 'Created'
  } else if (state === 1) {
    statusLabel = 'Status'
    statusValue = 'Active'
  } else if (state === 2) {
    statusLabel = 'Status'
    statusValue = 'Ended'
  }

  const handleCopy = (e) => {
    e.preventDefault()
    navigator.clipboard.writeText(pollId.toString())
    toast.success('Poll ID copied!')
  }

  return (
    <div className="p-8 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-serif font-bold text-gray-900 leading-tight">
            {title}
          </h3>
          <div className="mt-3 flex items-center gap-3 text-gray-600">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 border border-black/20 px-2 py-1 rounded-sm" title={pollId.toString()}>
            ID: {pollId.toString().length <= 8
              ? pollId.toString()
              : `${pollId.toString().slice(0, 4)}...${pollId.toString().slice(-4)}`}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200"
              title="Copy Poll ID"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
            </button>
          </div>
          {statusLabel && statusValue && (
            <div className="mt-3 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${state === 1 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                 <p className="text-sm font-medium uppercase tracking-wide text-gray-600">{statusValue}</p>
            </div>
          )}
        </div>
        {isOwner && (
          <span className="bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest border border-black">
            Owner
          </span>
        )}
      </div>

      <div className="mt-8 flex gap-6 border-t-2 border-black/5 pt-6 items-center">
        {isOwner ? (
          <Link href={`/poll/${pollId}/manage`}>
            <span className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
              Manage Poll
            </span>
          </Link>
        ) : (
          <Link href={`/poll/${pollId}`}>
            <span className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
              View Details
            </span>
          </Link>
        )}

        {state === 2 ? (
          <Link href={`/poll/${pollId}/nft`}>
            <span className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
              Mint Result NFT
            </span>
          </Link>
        ) : showVoteButton ? (
          <Link href={`/poll/${pollId}/vote`}>
            <span className="bg-black text-white px-6 py-2 rounded-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all text-sm uppercase tracking-wide">
              Vote Now
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}