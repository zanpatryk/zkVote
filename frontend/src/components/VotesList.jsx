import { motion, AnimatePresence } from 'framer-motion'
import { POLL_STATE } from '@/lib/constants'
import { getExplorerTxUrl } from '@/lib/utils/explorer'
import { usePollVotes } from '@/hooks/usePollVotes'

export default function VotesList({ pollId, pollState }) {
  const { votes, loading } = usePollVotes(pollId, pollState)

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <svg className="w-8 h-8 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold font-serif">Cast Votes ({votes.length})</h3>
        <div className="flex gap-2">
            {pollState === POLL_STATE.ACTIVE && (
                <motion.span 
                  animate={{ backgroundColor: ["#dcfce7", "#bbf7d0", "#dcfce7"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-800"
                >
                    Live Updates
                </motion.span>
            )}
        </div>
      </div>

      {votes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg">
          {pollState === POLL_STATE.CREATED ? "Voting hasn't started yet." : "No votes recorded yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 px-2 font-bold text-sm uppercase tracking-wider">Voter Address</th>
                <th className="py-3 px-2 font-bold text-sm uppercase tracking-wider text-right">Transaction</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {votes.map((vote) => (
                  <motion.tr
                    key={vote.transactionHash}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-2 font-mono text-sm">
                      {vote.voter}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <a 
                        href={getExplorerTxUrl(vote.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-black font-medium text-sm transition-colors group"
                      >
                        <span className="mr-1">View</span>
                        <svg className="w-3 h-3 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
