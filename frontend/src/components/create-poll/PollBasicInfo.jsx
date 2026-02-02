import { motion } from 'framer-motion'

export default function PollBasicInfo({ title, setTitle, description, setDescription, showDescription = true, compact = false }) {
  return (
    <>
      <motion.div
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.1 }}
         className={compact ? "mb-6" : "mb-10"}
      >
        <label className="block text-xl font-serif font-bold text-gray-900 mb-3">Poll Question</label>
        <input
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-5 py-4 border-2 border-black rounded-lg text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] outline-none transition-all placeholder-gray-400 font-medium"
          placeholder="e.g., Should we adopt the new governance proposal?"
        />
      </motion.div>

      {showDescription && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={compact ? "mb-6" : "mb-10"}
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
      )}
    </>
  )
}
