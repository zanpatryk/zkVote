import { POLL_STATE } from '@/lib/constants'
import { useExplorer } from '@/hooks/useExplorer'
import { motion, AnimatePresence } from 'framer-motion'
import { usePollRegistrations } from '@/hooks/usePollRegistrations'

export default function RegistrationList({ pollId, pollState }) {
  const { registrations, loading, error } = usePollRegistrations(pollId, pollState)
  const { getTxUrl } = useExplorer()

  if (loading) {
     return (
        <div className="border-2 border-black rounded-lg p-8 text-center bg-gray-50 animate-pulse">
            <p className="text-gray-500 font-mono">Loading registry...</p>
        </div>
     )
  }

  if (error) {
      return (
        <div className="border-2 border-black bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-black font-bold font-mono">{error}</p>
        </div>
      )
  }

  return (
    <div className="bg-white rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-0">
            <h3 className="text-xl font-bold font-serif">Registered Identities ({registrations.length})</h3>
            <div className="flex gap-2">
                {pollState === POLL_STATE.CREATED && (
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

        {registrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 italic border-2 border-dashed border-gray-200 rounded-lg">
                No identities registered yet.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-3 px-2 font-bold text-sm uppercase tracking-wider">Identity Commitment</th>
                            <th className="py-3 px-2 font-bold text-sm uppercase tracking-wider text-right">Transaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence initial={false}>
                            {registrations.map((reg) => (
                                <motion.tr 
                                    key={reg.transactionHash}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-2 font-mono text-sm truncate max-w-[200px] md:max-w-md" title={reg.identityCommitment}>
                                        {reg.identityCommitment}
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <a 
                                            href={getTxUrl(reg.transactionHash)}
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
