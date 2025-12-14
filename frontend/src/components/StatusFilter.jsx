'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function StatusFilter({ currentStatus, onStatusChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const options = [
    { value: 'all', label: 'All Status' },
    { value: '0', label: 'Created' },
    { value: '1', label: 'Active' },
    { value: '2', label: 'Ended' },
  ]

  const currentLabel = options.find(o => o.value === currentStatus)?.label || 'All Status'

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-48 flex items-center justify-between px-6 py-4 rounded-lg border-2 border-black bg-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] outline-none text-left"
      >
        <span className="font-medium text-gray-900">{currentLabel}</span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-0 mt-2 w-full md:w-48 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-50"
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onStatusChange(option.value)
                setIsOpen(false)
              }}
              className={`px-6 py-3 cursor-pointer transition hover:bg-gray-100 flex items-center justify-between border-b border-gray-100 last:border-0 ${
                currentStatus === option.value ? 'bg-black text-white hover:bg-black/90' : 'text-gray-700'
              }`}
            >
              <span className={currentStatus === option.value ? 'font-bold' : ''}>{option.label}</span>
              {currentStatus === option.value && (
                <span className="text-white">✓</span>
              )}
            </div>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
