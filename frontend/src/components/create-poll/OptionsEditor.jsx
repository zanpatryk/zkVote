import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

export default function OptionsEditor({ options, setOptions, isSecret }) {

  const addOption = () => {
    if (isSecret && options.length >= 16) {
      return toast.error('Encrypted polls are limited to 16 options')
    }
    setOptions([...options, ''])
  }
  
  const removeOption = (i) => setOptions(options.filter((_, idx) => idx !== i))
  const updateOption = (i, value) => {
    const newOptions = [...options]
    newOptions[i] = value
    setOptions(newOptions)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-10"
    >
      <div className="flex justify-between items-end mb-4">
        <label className="block text-xl font-serif font-bold text-gray-900">Voting Options</label>
        {isSecret && (
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Limit: 16 Options
          </span>
        )}
      </div>
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
                  ✕
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
        className="mt-6 px-6 py-3 border-2 border-black bg-white rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSecret && options.length >= 16}
      >
        + Add Another Option
      </motion.button>
    </motion.div>
  )
}
