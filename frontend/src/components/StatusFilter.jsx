'use client'

import { useState, useRef, useEffect } from 'react'

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
        className="w-full md:w-48 flex items-center justify-between px-6 py-4 rounded-2xl border-2 border-black/10 hover:border-black/30 bg-white transition outline-none text-left"
      >
        <span className="font-medium text-gray-700">{currentLabel}</span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-full md:w-48 bg-white rounded-2xl border-2 border-black/10 shadow-xl overflow-hidden z-50">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onStatusChange(option.value)
                setIsOpen(false)
              }}
              className={`px-6 py-3 cursor-pointer transition hover:bg-gray-50 flex items-center justify-between ${
                currentStatus === option.value ? 'bg-gray-50 font-semibold' : 'text-gray-600'
              }`}
            >
              {option.label}
              {currentStatus === option.value && (
                <span className="text-black">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
