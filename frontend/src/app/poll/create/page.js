'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createPoll } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function CreatePollPage() {
  const router = useRouter()
  const { isConnected } = useAccount()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])

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


    setIsSubmitting(true)

    try {
      const pollId = await createPoll({
        title: title.trim(),
        description: description.trim(),
        options: cleanOptions,
      })
      
      // Redirect to the new whitelist page for the created poll
      console.log('Poll created with ID:', pollId, 'Redirecting to whitelist...')
      router.push(`/poll/${pollId}/whitelist`)
    } catch (err) {
      console.error('Failed to create poll:', err)
      // Error toast is handled by functionality in write.js
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Create New Poll</h1>
        <p className="text-lg text-gray-600">Launch a secure, tamper-proof vote.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Poll Title */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.1 }}
        >
          <label className="block text-xl font-serif font-bold text-gray-900 mb-3">Poll Question</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-5 py-4 border-2 border-black rounded-lg text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] outline-none transition-all placeholder-gray-400 font-medium"
            placeholder="e.g., What is your favorite color?"
          />
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
           <label className="block text-xl font-serif font-bold text-gray-900 mb-3">Description <span className="text-gray-400 font-sans text-base font-normal">(Optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-5 py-4 border-2 border-black rounded-lg text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] outline-none transition-all placeholder-gray-400 font-medium resize-none"
            placeholder="Provide context for voters..."
          />
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-xl font-serif font-bold text-gray-900 mb-4">Voting Options</label>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {options.map((opt, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-4"
                >
                  <input
                    type="text"
                    required={i < 2}
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    className="flex-1 px-5 py-3 border-2 border-black rounded-lg text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] outline-none transition-all placeholder-gray-400 font-medium"
                    placeholder={`Option ${i + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="px-6 border-2 border-black bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={addOption}
            className="mt-6 px-6 py-3 border-2 border-black bg-white rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm uppercase tracking-wide"
          >
            + Add Another Option
          </motion.button>
        </motion.div>

        {/* Submit */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t-2 border-black/5"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-5 rounded-lg text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Poll...' : 'Launch Poll'}
          </motion.button>
        </motion.div>
      </form>
    </div>
  )
}