'use client'

import { useCreatePollForm } from '@/hooks/useCreatePollForm'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'

// Modular Components
import PollBasicInfo from '@/components/create-poll/PollBasicInfo'
import PollSettings from '@/components/create-poll/PollSettings'
import KeyGenerator from '@/components/create-poll/KeyGenerator'
import VoterCapacity from '@/components/create-poll/VoterCapacity'
import OptionsEditor from '@/components/create-poll/OptionsEditor'

export default function CreatePollPage() {
  const {
    title, setTitle,
    description, setDescription,
    depth, setDepth,
    options, setOptions,
    isAnonymous, setIsAnonymous,
    isSecret, setIsSecret,
    generatedKeys, setGeneratedKeys,
    hasSavedKey, setHasSavedKey,
    isSubmitting,
    handleSubmit
  } = useCreatePollForm()

  return (
    <div className="pt-24 max-w-2xl mx-auto px-6 pb-32">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 md:mb-12 flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6 md:gap-0"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-2 md:mb-4">Create New Poll</h1>
          <p className="text-lg text-gray-600">Launch a secure, tamper-proof vote.</p>
        </div>
        <div className="w-full md:w-auto flex justify-end">
           <BackButton href="/poll" label="Back to Polls" />
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        
        <PollBasicInfo 
          title={title} 
          setTitle={setTitle} 
          description={description} 
          setDescription={setDescription} 
        />

        <PollSettings
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          isSecret={isSecret}
          setIsSecret={setIsSecret}
          onOptionsLimitChange={() => {
             if (options.length > 16) setOptions(options.slice(0, 16))
          }}
        />

        <AnimatePresence>
          {isSecret && (
            <KeyGenerator
              generatedKeys={generatedKeys}
              setGeneratedKeys={setGeneratedKeys}
              hasSavedKey={hasSavedKey}
              setHasSavedKey={setHasSavedKey}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnonymous && (
            <VoterCapacity depth={depth} setDepth={setDepth} />
          )}
        </AnimatePresence>

        <OptionsEditor
          options={options}
          setOptions={setOptions}
          isSecret={isSecret}
        />

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