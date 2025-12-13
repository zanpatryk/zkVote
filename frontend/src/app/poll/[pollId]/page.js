"use client"
import PollDetails from '@/components/PollDetails'
import { useParams } from 'next/navigation'

export default function ManagePoll() {
  const { pollId } = useParams()

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <h1 className="text-4xl font-bold mb-4">Poll Details</h1>
      <PollDetails pollId={pollId} />
    </div>
  )
}