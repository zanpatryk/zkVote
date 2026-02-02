'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { mintResultNFT } from '@/lib/blockchain/engine/write'
import { useMintEligibility } from '@/hooks/useMintEligibility'
import PollDetails from '@/components/PollDetails'
import { toast } from 'react-hot-toast'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'
import { motion } from 'framer-motion'
import BackButton from '@/components/BackButton'
import ConnectionError from '@/components/ConnectionError'

export default function MintNFTPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const { isConnected } = useAccount()
  
  const { 
    poll, 
    canMint, 
    hasMinted, 
    isWrongState, 
    isResultsPending, 
    isLoading, 
    error, 
    refetchNFTs 
  } = useMintEligibility(pollId)

  const [minting, setMinting] = useState(false)

  // Redirect Logic
  useEffect(() => {
    if (!isLoading && !error) {
       if (isWrongState) {
          toast.error("This poll has not ended yet.")
          router.replace(`/poll/${pollId}`)
       } else if (isResultsPending) {
          toast.error("Tally Results Not Yet Published")
          router.replace(`/poll/${pollId}`)
       }
    }
  }, [isLoading, isWrongState, isResultsPending, pollId, router, error])

  const handleMint = async () => {
    if (!canMint) return
    setMinting(true)
    const toastId = toast.loading('Minting Result NFT...', { id: 'nft' })
    try {
      await mintResultNFT(pollId)
      toast.success('NFT minted successfully!', { id: toastId })
      // Refetch NFTs to update the UI via hook state
      refetchNFTs()
    } catch (error) {
      console.error("Minting failed", error)
      toast.error(formatTransactionError(error, 'Failed to mint NFT'), { id: toastId })
    } finally {
      setMinting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <p className="text-gray-600">Verifying eligibility...</p>
      </div>
    )
  }
  
  if (error) {
      return (
        <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
           <ConnectionError error={error} />
        </div>
      )
  }

  if (!isConnected) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">Please connect your wallet to view this page.</p>
      </div>
    )
  }
  
  // If poll is valid but user is not authorized (not owner and not whitelisted)
  if (poll && !canMint && !isWrongState && !isResultsPending) {
      return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Not Authorized</h1>
        <p className="text-gray-600 mb-6">You are not authorized to mint the result NFT for this poll.</p>
        <button 
          onClick={() => router.push(`/poll/${pollId}`)}
          className="text-black hover:underline"
        >
          Back to Poll Details
        </button>
      </div>
    )
  }

  return (
    <div className="pt-24 max-w-3xl mx-auto px-6 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12"
      >
        <div>
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">Mint Result NFT</h1>
            <p className="text-gray-500">Collect your voting history.</p>
        </div>
        <BackButton href="/poll" label="Back to Dashboard" />
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-white p-10 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-12 text-center"
      >
        <div className="mb-10 max-w-lg mx-auto">
            <h2 className="text-3xl font-serif font-bold mb-4 text-gray-900">Commemorative Result NFT</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
                This poll has ended. As a participant or creator, you can mint an NFT containing the final results as permanent proof of the outcome.
            </p>
        </div>

        <div className="flex justify-center">
          {!hasMinted ? (
             <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMint}
            disabled={minting}
            className="px-10 py-4 bg-black text-white text-xl font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {minting ? 'Minting NFT...' : 'Mint Result NFT'}
          </motion.button>
          ) : (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
              className="inline-flex items-center gap-2 text-black font-bold text-lg border-2 border-black bg-gray-100 px-8 py-4 rounded-lg"
            >
              NFT Badge Minted Successfully
            </motion.div>
          )}
        </div>
      </motion.div>

      {hasMinted && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="opacity-75"
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-400">Final Results</h3>
          <PollDetails pollId={pollId} showResults={true} />
        </motion.div>
      )}
    </div>
  )
}
