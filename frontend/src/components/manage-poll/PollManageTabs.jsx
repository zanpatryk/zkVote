'use client'

import { motion } from 'framer-motion'

export default function PollManageTabs({ activeTab, setActiveTab, isZK = false, isSecret = false }) {
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'whitelist', label: 'Whitelisting' },
    ...(isZK ? [{ id: 'registration', label: 'Registrations' }] : []),
    { id: 'votes', label: 'Votes' },
    ...(isSecret ? [{ id: 'results', label: 'Results' }] : []),
  ]

  return (
    <div className="flex border-b-2 border-black mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-base font-bold transition-colors relative whitespace-nowrap ${
            activeTab === tab.id 
              ? 'text-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
             <motion.div 
               layoutId="tab-indicator"
               className="absolute bottom-0 left-0 right-0 h-[3px] bg-black translate-y-full" 
             />
          )}
        </button>
      ))}
    </div>
  )
}
