'use client'

import { useState } from 'react'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { usePublishTally } from '@/hooks/usePublishTally'
import { POLL_STATE } from '@/lib/constants'

// Demo data for preview
const DEMO_TALLY = [127n, 89n, 29n]

export default function TallyManager({ pollId, pollState, isSecret, demo = false }) {
  const [sk, setSk] = useState('')
  
  // In demo mode, use static values; otherwise use hooks
  const resultsPublished = demo ? false : null
  const isProcessing = false
  const decryptedTally = demo ? DEMO_TALLY : null
  const ciphertexts = demo ? true : null
  
  // Only call hooks in non-demo mode
  let hookData = { resultsPublished: false, publishTally: () => {}, isProcessing: false, decryptedTally: null, ciphertexts: null }
  if (!demo) {
    const registry = usePollRegistry(pollId)
    const tally = usePublishTally(pollId)
    hookData = { 
      resultsPublished: registry.resultsPublished, 
      ...tally 
    }
  }
  
  const actualResultsPublished = demo ? false : hookData.resultsPublished
  const actualIsProcessing = demo ? false : hookData.isProcessing
  const actualDecryptedTally = demo ? DEMO_TALLY : hookData.decryptedTally
  const actualCiphertexts = demo ? true : hookData.ciphertexts
  const publishTally = hookData.publishTally

  if (!isSecret && !demo) {
    return (
        <div className="bg-white p-8 rounded-lg text-center border-2 border-black">
            <h3 className="text-xl font-bold text-black mb-2">Public Poll</h3>
            <p className="text-gray-600">This poll is not encrypted. Results are available publicly without decryption.</p>
        </div>
    )
  }

  const handleDecryptAndPublish = async () => {
    if (demo) return
    await publishTally(sk)
  }

  if (pollState !== POLL_STATE.ENDED && !demo) {
      return ( 
          <div className="bg-gray-50 p-8 rounded-lg text-center border-2 border-dashed border-gray-300">
              <h3 className="text-xl font-bold text-gray-400 mb-2">Tally Locked</h3>
              <p className="text-gray-500">You must END the poll before decrypting results.</p>
          </div>
      )
  }

  if (actualResultsPublished && !demo) {
    return (
        <div className="bg-gray-100 p-8 rounded-lg text-center border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <h3 className="text-xl font-bold text-black mb-2">Results Published</h3>
            <p className="text-gray-600">The tally has been decrypted and published to the blockchain.</p>
        </div>
    )
  }

  return (
    <div className={`bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${demo ? 'max-w-md' : ''}`}>
      <h3 className="text-2xl font-bold mb-6">Decrypt Tally</h3>
      
      <div className="mb-6">
        <label htmlFor="poll-sk" className="block text-sm font-bold mb-2">Poll Secret Key (SK)</label>
        <input 
            id="poll-sk"
            type="password" 
            value={sk}
            onChange={(e) => setSk(e.target.value)}
            disabled={!demo && false}
            className="w-full p-3 border-2 border-black rounded-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transition-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]"
            placeholder="Enter the huge number saved during creation..."
        />
        <p className="text-xs text-gray-500 mt-2">
            This key never leaves your device. Decryption and proof generation happen locally.
        </p>
      </div>
      
      {actualDecryptedTally && (
          <div className="mb-6 bg-gray-100 p-4 border border-black">
              <h4 className="font-bold mb-2">Preview Decrypted Results:</h4>
              <div className="grid grid-cols-2 gap-2">
                  {actualDecryptedTally.map((count, i) => (
                      <div key={i} className="flex justify-between border-b border-gray-300 py-1">
                          <span>Option {i}</span>
                          <span className="font-mono font-bold">{count.toString()}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      <button 
        onClick={handleDecryptAndPublish}
        disabled={actualIsProcessing || (!actualCiphertexts && !demo)}
        className="w-full bg-black text-white px-6 py-3 font-bold hover:bg-gray-800 disabled:opacity-50 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        {actualIsProcessing ? 'Processing (Generating Proof...)' : 'Decrypt & Publish Results'}
      </button>
      
      {!actualCiphertexts && !demo && <p className="text-center mt-4 text-gray-500">Loading encrypted data...</p>}
    </div>
  )
}
