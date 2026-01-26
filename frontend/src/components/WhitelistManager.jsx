'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useWhitelistedAddresses } from '@/hooks/useWhitelistedAddresses'
import { isUserWhitelisted } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { isAddress } from 'viem'
import { parseAddressesFromFile } from '@/lib/utils/file'

export default function WhitelistManager({ pollId, pollState, onSuccess, demo = false }) {
  const { isConnected } = useAccount()
  const { addToWhitelist } = useWhitelistedAddresses(pollId)

  const [singleAddress, setSingleAddress] = useState(demo ? '0xdef0...mnop' : '')
  const [batchAddresses, setBatchAddresses] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState('single') // 'single' | 'batch'

  // Demo mode uses static handlers that do nothing
  const handleCopy = () => {
    if (demo) return
    navigator.clipboard.writeText(pollId.toString())
    toast.success('Poll ID copied!')
  }

  const handleFileChange = async (e) => {
    if (demo) return
    const file = e.target.files[0]
    if (!file) return

    try {
      const addresses = await parseAddressesFromFile(file)
      
      if (addresses.length === 0) {
        toast.error('No valid addresses found in the file.')
        setBatchAddresses([])
        return
      }

      setBatchAddresses(addresses)
      toast.success(`Found ${addresses.length} valid addresses.`)
    } catch (error) {
      console.error('File parsing error:', error)
      toast.error('Failed to process file.')
      setBatchAddresses([])
    }
  }

  const handleSingleAddressSubmit = async (e) => {
    e.preventDefault()
    if (demo) return
    if (!isConnected) return toast.error('Please connect your wallet first')
    
    const address = singleAddress.trim().toLowerCase()
    if (!isAddress(address)) {
      return toast.error('Please enter a valid wallet address.')
    }

    setIsSubmitting(true)
    try {
      const { data: isAlreadyWhitelisted } = await isUserWhitelisted(pollId, address)
      if (isAlreadyWhitelisted) {
        toast.error('User is already whitelisted.')
        setSingleAddress('')
        return
      }

      await addToWhitelist([address])
      setSingleAddress('')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to whitelist user:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatchSubmit = async () => {
    if (demo) return
    if (!isConnected) return toast.error('Please connect your wallet first')
    if (batchAddresses.length === 0) return toast.error('No addresses to whitelist.')
    
    setIsSubmitting(true)
    try {
      await addToWhitelist(batchAddresses)
      setBatchAddresses([])
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to whitelist users:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Disable interactions only in real mode if poll is not created
  const isDisabled = !demo && Number(pollState) !== 0

  return (
    <div className={`w-full ${demo ? 'max-w-md' : ''}`}>
      <div className="space-y-8">
        {/* Mode Toggle */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex rounded-lg border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <button
            onClick={() => setMode('single')}
            className={`flex-1 py-3 font-bold text-lg transition relative ${
              mode === 'single'
                ? 'text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
             {mode === 'single' && (
                <motion.div 
                  layoutId={demo ? undefined : "activeTab"}
                  className="absolute inset-0 bg-black"
                  initial={false}
                  transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                />
             )}
            <span className="relative z-10">Single Address</span>
          </button>
          <div className="w-0.5 bg-black"></div>
          <button
            onClick={() => setMode('batch')}
            className={`flex-1 py-3 font-bold text-lg transition relative ${
              mode === 'batch'
                ? 'text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
             {mode === 'batch' && (
                <motion.div 
                  layoutId={demo ? undefined : "activeTab"}
                  className="absolute inset-0 bg-black"
                  initial={false}
                  transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                />
             )}
            <span className="relative z-10">Batch Upload</span>
          </button>
        </motion.div>

        {/* Single Address Input */}
        <AnimatePresence mode="wait">
        {mode === 'single' && (
          <motion.form 
            key="single"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSingleAddressSubmit} 
            className="space-y-6 bg-white border-2 border-black p-8 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div>
              <label className="block text-xl font-serif font-bold mb-3">Whitelist Single Address</label>
              <input
                type="text"
                value={singleAddress}
                onChange={e => setSingleAddress(e.target.value)}
                disabled={isDisabled}
                className="w-full px-5 py-4 border-2 border-black rounded-lg text-lg outline-none focus:bg-gray-50 transition-colors font-mono placeholder-gray-400 disabled:opacity-50 transition-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.05)]"
                placeholder={isDisabled ? "Whitelisting closed" : "0x..."}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isDisabled || isSubmitting}
              className="w-full bg-black text-white py-4 rounded-lg text-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {isSubmitting ? 'Whitelisting...' : 'Whitelist Address'}
            </motion.button>
          </motion.form>
        )}

        {/* File Upload */}
        {mode === 'batch' && (
          <motion.div 
            key="batch"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white border-2 border-black p-8 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6"
          >
            <div>
              <label htmlFor="file-upload" className="block text-xl font-serif font-bold mb-2">Upload File</label>
              <p className="text-sm text-gray-500 mb-4">Upload a .txt file with addresses separated by newlines, commas, or spaces.</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer relative text-center">
                  <input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  disabled={isDisabled || isSubmitting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                 <p className="font-medium text-gray-700">{isDisabled ? 'Whitelisting Closed' : 'Click to Select File'}</p>
              </div>
            </div>

            {batchAddresses.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gray-50 p-4 rounded-lg border-2 border-black border-dashed"
              >
                <p className="text-black font-bold font-mono">
                  Ready to whitelist {batchAddresses.length} addresses.
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleBatchSubmit}
              disabled={isDisabled || isSubmitting || (batchAddresses.length === 0 && !demo)}
              className="w-full bg-black text-white py-4 rounded-lg text-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {isSubmitting ? 'Whitelisting...' : (isDisabled ? 'Whitelisting Closed' : (batchAddresses.length === 0 && demo ? 'Whitelist Users' : `Whitelist ${batchAddresses.length} Users`))}
            </motion.button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}
