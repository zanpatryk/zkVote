'use client'

import { useRouter } from 'next/navigation'

export default function VoteChecker() {
  const router = useRouter()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()

    // Expect lines like: "Poll ID: X" and "Vote ID: Y"
    const pollMatch = text.match(/Poll ID:\s*((?:0x)?[0-9a-fA-F]+)/i)
    const voteMatch = text.match(/Vote ID:\s*((?:0x)?[0-9a-fA-F]+)/i)

    if (!pollMatch || !voteMatch) {
      alert('Could not read poll and vote IDs from this receipt file.')
      return
    }

    const pollId = pollMatch[1]
    const voteId = voteMatch[1]

    router.push(`/poll/${pollId}/vote/check/${voteId}`)
  }

  return (
    <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-sm text-left max-w-3xl mx-auto w-full">
      <h2 className="text-2xl font-semibold mb-3">Check your vote</h2>
      <p className="text-gray-600 mb-6">
        Upload a vote receipt file (.txt) to view its details again.
      </p>
      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
        aria-label="Upload vote receipt"
        className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 cursor-pointer"
      />
    </div>
  )
}
