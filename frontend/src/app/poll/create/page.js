'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createPoll } from '@/lib/blockchain/write'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function CreatePollPage() {
  const router = useRouter()
  const { isConnected } = useAccount()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addOption = () => setOptions([...options, ''])
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i))
  const updateOption = (i, value) => {
    const newOptions = [...options]
    newOptions[i] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isConnected) return toast.error('Please connect your wallet first')

    const cleanOptions = options.filter(o => o.trim() !== '')
    if (cleanOptions.length < 2) return toast.error('Need at least 2 options')
    if (!title.trim()) return toast.error('Poll title is required')
    if (!startDate) return toast.error('Please select a start date and time')
    if (!endDate) return toast.error('Please select an end date and time')

    setIsSubmitting(true)

    try {
      const pollId = await createPoll({
        title: title.trim(),
        description: description.trim(),
        options: cleanOptions,
        startTime: new Date(startDate).getTime(),
        endTime: new Date(endDate).getTime(),
      })

      // Redirect to the new whitelist page for the created poll
      router.push(`/poll/${pollId}/whitelist`)
    } catch (err) {
      console.error('Failed to create poll:', err)
      toast.error(err.shortMessage || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      {/* ← + Title */}
      <div className="flex items-center gap-8 mb-10">
        <Link href="/poll">
          <div className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer">
            <span className="text-3xl font-light">←</span>
          </div>
        </Link>
        <h1 className="text-4xl font-bold">Create New Poll</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Poll Title */}
        <div>
          <label className="block text-lg font-medium mb-2">Poll Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black rounded-xl text-lg"
            placeholder="What is your favorite color?"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-lg font-medium mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-black rounded-xl text-lg"
            placeholder="Add more context..."
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-lg font-medium mb-4">Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <input
                type="text"
                required={i < 2}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-black rounded-xl text-lg"
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="px-6 bg-red-500 text-white rounded-xl hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="mt-3 px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 font-medium"
          >
            + Add Option
          </button>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-lg font-medium mb-2">Start Date & Time</label>
          <input
            type="datetime-local"
            required
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-3 border-2 border-black rounded-xl text-lg"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-lg font-medium mb-2">End Date & Time</label>
          <input
            type="datetime-local"
            required
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-3 border-2 border-black rounded-xl text-lg"
          />
        </div>

        {/* Submit */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-5 rounded-2xl text-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  )
}