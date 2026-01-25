'use client'

import { useState } from 'react'
import { Identity } from '@semaphore-protocol/identity'
import { toast } from 'react-hot-toast'

export default function IdentityFileUploader({ onIdentityParsed, isVerifying = false, className = '' }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isParsing, setIsParsing] = useState(false)

  const isLoading = isVerifying || isParsing

  const handleFile = async (file) => {
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a valid JSON identity file')
      return
    }

    setIsParsing(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      
      // 1. Extract Poll ID (Optional in schema but we treat it as context)
      const pollId = json.pollId

      // 2. Extract Secret/Private Key
      const secret = json.secret || json.privateKey || json._privateKey || json.trapdoor
      
      if (!secret) {
        throw new Error('Invalid identity file: Missing private key')
      }

      // 3. Reconstruct Identity Object
      // We reconstruct it here to validate it actually works before redirecting
      const identity = new Identity(secret)
      
      // Return parsed data to parent
      await onIdentityParsed({ identity, pollId, json })

    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(error.message || 'Failed to parse identity file')
    } finally {
      setIsParsing(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div 
      className={`
        border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all cursor-pointer bg-white group
        ${isDragOver ? 'border-black bg-gray-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400'}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById('common-identity-upload').click()}
    >
      <input 
        type="file" 
        id="common-identity-upload" 
        className="hidden" 
        accept=".json"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      
      <div className="h-16 w-16 md:h-20 md:w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:bg-gray-200 transition-colors">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
         </svg>
      </div>

      <h3 className="text-xl md:text-2xl font-bold mb-2">
        {isLoading ? 'Verifying Identity...' : 'Upload Identity JSON'}
      </h3>
      <p className="text-gray-500 text-sm md:text-base mb-6">
        Drag & drop your file here, or click to browse
      </p>
      
      <button className="px-6 py-2 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition">
        Choose File
      </button>
    </div>
  )
}
