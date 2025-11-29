'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { whitelistUser, whitelistUsers } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'
import { isAddress } from 'viem'

export default function WhitelistPage() {
  const { pollId } = useParams()
  const router = useRouter()
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
      await whitelistUser(pollId, address)
      setSingleAddress('')
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
      router.push('/poll')
    } catch (err) {
      console.error('Failed to whitelist users:', err)
      toast.error(err.shortMessage || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <h1 className="text-4xl font-bold mb-2">Whitelist Voters</h1>
      <div className="flex items-center gap-2 mb-10 text-gray-600">
        <p>For Poll ID:</p>
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg font-mono">
          <span>
            {pollId.toString().length <= 8
              ? pollId.toString()
              : `${pollId.toString().slice(0, 4)}...${pollId.toString().slice(-4)}`}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            title="Copy Poll ID"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Mode Toggle */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${
              mode === 'single'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Single Address
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition ${
              mode === 'batch'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Batch Upload
          </button>
        </div>

        {/* Single Address Input */}
        {mode === 'single' && (
          <form onSubmit={handleSingleAddressSubmit} className="space-y-4 bg-white border-2 border-black p-8 rounded-2xl shadow-lg">
            <div>
              <label className="block text-lg font-medium mb-2">Whitelist Single Address</label>
              <input
                type="text"
                value={singleAddress}
                onChange={e => setSingleAddress(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-lg"
                placeholder="0x..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Whitelisting...' : 'Whitelist Address'}
            </button>
          </form>
        )}

        {/* File Upload */}
        {mode === 'batch' && (
          <div className="bg-white border-2 border-black p-8 rounded-2xl shadow-lg space-y-6">
            <div>
              <label className="block text-lg font-medium mb-2">Upload File</label>
              <p className="text-sm text-gray-500 mb-4">Upload a .txt file with addresses separated by newlines, commas, or spaces.</p>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="w-full text-lg file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-md file:font-semibold file:bg-gray-200 file:text-black hover:file:bg-gray-300"
              />
            </div>

            {batchAddresses.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-green-800 font-medium">
                  Ready to whitelist {batchAddresses.length} addresses.
                </p>
              </div>
            )}

            <button
              onClick={handleBatchSubmit}
              disabled={isSubmitting || batchAddresses.length === 0}
              className="w-full bg-black text-white py-4 rounded-xl text-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Whitelisting...' : `Whitelist ${batchAddresses.length} Users`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}