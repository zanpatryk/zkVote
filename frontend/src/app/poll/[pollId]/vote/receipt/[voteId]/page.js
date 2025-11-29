"use client"

import { useParams } from 'next/navigation'

export default function VoteReceiptPage() {
  const { pollId, voteId } = useParams()

  const handleDownload = () => {
    const content = `zkVote Receipt\nPoll ID: ${BigInt(pollId).toString(16)}\nVote ID: ${BigInt(voteId).toString(16)}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `zkvote-receipt-poll-${pollId}-vote-${voteId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
      <h1 className="text-4xl font-bold mb-4">Vote receipt</h1>
      <p className="text-lg text-gray-700 mb-8">
        Your vote has been successfully submitted.
      </p>


      <button
        type="button"
        onClick={handleDownload}
        className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800"
      >
        Download receipt (.txt)
      </button>
    </div>
  )
}
