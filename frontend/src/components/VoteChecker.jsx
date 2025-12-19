'use client'

import { useRouter } from 'next/navigation'

export default function VoteChecker() {
  const router = useRouter()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()

    // Expect lines like: "Poll ID: X", "Vote ID: Y", "Tx Hash: Z"
    const pollMatch = text.match(/Poll ID:\s*((?:0x)?[0-9a-fA-F]+)/i)
    const voteMatch = text.match(/Vote ID:\s*((?:0x)?[0-9a-fA-F]+)/i)
    const txMatch = text.match(/Tx Hash:\s*((?:0x)?[0-9a-fA-F]+)/i)

    if (!pollMatch || !voteMatch) {
      alert('Could not read poll and vote IDs from this receipt file.')
      return
    }

    const pollId = pollMatch[1]
    const voteId = voteMatch[1]
    const txHash = txMatch ? txMatch[1] : null

    const url = `/poll/${pollId}/vote/check/${voteId}${txHash ? `?txHash=${txHash}` : ''}`
    router.push(url)
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left max-w-2xl mx-auto w-full">
      <div className="mb-6">
         <h2 className="text-2xl font-serif font-bold mb-2">Upload Receipt</h2>
         <p className="text-gray-500">Select the <code className="bg-gray-100 px-1 rounded text-black">.txt</code> file required when you voted.</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors group cursor-pointer relative">
        <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            aria-label="Upload vote receipt"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="pointer-events-none">
             <span className="text-lg font-medium text-gray-900 group-hover:underline">Click to upload receipt</span>
             <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
        </div>
      </div>
    </div>
  )
}
