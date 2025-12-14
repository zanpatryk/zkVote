"use client"
import PollDetails from '@/components/PollDetails'
import { useParams, useRouter } from 'next/navigation'

export default function ManagePoll() {
  const { pollId } = useParams()
  const router = useRouter()

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-left">
       <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Poll Details</h1>
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-600 hover:text-black whitespace-nowrap"
        >
          ← Go Back
        </button>
      </div>
      
      <PollDetails pollId={pollId} />
    </div>
  )
}