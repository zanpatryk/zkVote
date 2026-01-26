'use client'

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { usePoll } from '@/hooks/usePolls'
import WhitelistManager from '@/components/WhitelistManager'
import WhitelistedAddressesList from '@/components/WhitelistedAddressesList'
import BackButton from '@/components/BackButton'

export default function WhitelistPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const { poll, isLoading } = usePoll(pollId)
  const pollState = poll?.state

  if (isLoading) {
      return (
          <div className="pt-32 max-w-3xl mx-auto px-6 text-center">
              <p className="text-gray-500">Loading...</p>
          </div>
      )
  }

  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 md:mb-12 flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-6 md:gap-0"
      >
        <div>
           <h1 className="text-4xl md:text-5xl font-black font-serif mb-2 tracking-tight">Whitelist Voters</h1>
           <p className="text-xl text-gray-600 font-medium">Add addresses allowed to participate in the poll.</p>
        </div>
        <div className="w-full md:w-auto flex justify-end">
            <BackButton href={`/poll/${pollId}/manage`} label="Manage Poll" direction="forward" />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <WhitelistManager 
          pollId={pollId} 
          pollState={pollState}
        />
        <WhitelistedAddressesList pollId={pollId} />
      </motion.div>
    </div>
  )
}