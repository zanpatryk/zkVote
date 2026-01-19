'use client'

import { useRouter } from 'next/navigation'
import { parseJsonFile } from '@/lib/utils/file'

export default function VoteChecker({ onVerify }) {
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await parseJsonFile(file)
      if (!data.pollId || !data.voteId) {
        throw new Error('Missing pollId or voteId')
      }

      if (onVerify) {
        onVerify(data)
      }
    } catch (err) {
      alert('Invalid receipt file. Please upload a valid zkVote receipt (.json).')
    }
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left max-w-2xl mx-auto w-full">
      <div className="mb-6">
         <h2 className="text-2xl font-serif font-bold mb-2">Upload Receipt</h2>
         <p className="text-gray-500">Select the <code className="bg-gray-100 px-1 rounded text-black">.json</code> file received when you voted.</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors group cursor-pointer relative">
        <input
            type="file"
            accept=".json"
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
