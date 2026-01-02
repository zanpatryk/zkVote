'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { whitelistUser, whitelistUsers } from '@/lib/blockchain/engine/write'
import { isUserWhitelisted } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { isAddress } from 'viem'

export default function WhitelistManager({ pollId, pollState, onSuccess }) {
  const { isConnected } = useAccount()

  const [singleAddress, setSingleAddress] = useState('')
  const [batchAddresses, setBatchAddresses] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState('single') // 'single' | 'batch'

  const handleCopy = () => {
    navigator.clipboard.writeText(pollId.toString())
    toast.success('Poll ID copied!')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      // Assuming addresses are separated by newlines, commas, or spaces
      // Normalize to lowercase to handle mixed-case addresses with invalid checksums
      const addresses = content.split(/[\n, ]+/).map(addr => addr.trim().toLowerCase()).filter(isAddress)
      
      if (addresses.length === 0) {
        toast.error('No valid addresses found in the file.')
        setBatchAddresses([])
        return
      }

      setBatchAddresses(addresses)
      toast.success(`Found ${addresses.length} valid addresses.`)
    }
    reader.readAsText(file)
  }

  const handleSingleAddressSubmit = async (e) => {
    e.preventDefault()
    if (!isConnected) return toast.error('Please connect your wallet first')
    
    const address = singleAddress.trim().toLowerCase()
    if (!isAddress(address)) {
      return toast.error('Please enter a valid wallet address.')
    }

    setIsSubmitting(true)
    try {
      const isAlreadyWhitelisted = await isUserWhitelisted(pollId, address)
      if (isAlreadyWhitelisted) {
        toast.error('User is already whitelisted.')
        setSingleAddress('')
        return
      }

      await whitelistUser(pollId, address)
      setSingleAddress('')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to whitelist user:', err)
      toast.error(err.shortMessage || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBatchSubmit = async () => {
    if (!isConnected) return toast.error('Please connect your wallet first')
    if (batchAddresses.length === 0) return toast.error('No addresses to whitelist.')
    
    setIsSubmitting(true)
    try {
      await whitelistUsers(pollId, batchAddresses)
      setBatchAddresses([])
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to whitelist users:', err)
      toast.error(err.shortMessage || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">


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
                  layoutId="activeTab"
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
                  layoutId="activeTab"
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
                disabled={Number(pollState) !== 0}
                className="w-full px-5 py-4 border-2 border-black rounded-lg text-lg outline-none focus:bg-gray-50 transition-colors font-mono placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={Number(pollState) !== 0 ? "Whitelisting closed" : "0x..."}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting || Number(pollState) !== 0}
              className="w-full bg-black text-white py-4 rounded-lg text-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {isSubmitting ? 'Whitelisting...' : (Number(pollState) !== 0 ? 'Whitelisting Closed' : 'Whitelist Address')}
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
                  disabled={isSubmitting || Number(pollState) !== 0}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                 <p className="font-medium text-gray-700">{Number(pollState) !== 0 ? 'Whitelisting Closed' : 'Click to Select File'}</p>
              </div>
            </div>

            {batchAddresses.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-green-50 p-4 rounded-lg border border-green-200"
              >
                <p className="text-green-800 font-medium">
                  Ready to whitelist {batchAddresses.length} addresses.
                </p>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleBatchSubmit}
              disabled={isSubmitting || batchAddresses.length === 0 || Number(pollState) !== 0}
              className="w-full bg-black text-white py-4 rounded-lg text-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              {isSubmitting ? 'Whitelisting...' : (Number(pollState) !== 0 ? 'Whitelisting Closed' : `Whitelist ${batchAddresses.length} Users`)}
            </motion.button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}
