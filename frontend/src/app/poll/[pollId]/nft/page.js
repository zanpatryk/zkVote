"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, isUserWhitelisted, getUserNFTs } from '@/lib/blockchain/engine/read'
import { mintResultNFT } from '@/lib/blockchain/engine/write'
import PollDetails from '@/components/PollDetails'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function MintNFTPage() {
  const { pollId } = useParams()
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()
  
  const [loading, setLoading] = useState(true)
  const [canMint, setCanMint] = useState(false)
  const [poll, setPoll] = useState(null)
  const [minting, setMinting] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)

  useEffect(() => {
    async function checkEligibility() {
      if (!isConnected || !userAddress || !pollId) {
        setLoading(false)
        return
      }

      try {
        const pollData = await getPollById(pollId)
        setPoll(pollData)

        if (!pollData) {
          setLoading(false)
          return
        }

        // Must be ENDED (state 2)
        if (Number(pollData.state) !== 2) {
          toast.error("This poll has not ended yet.")
          router.replace(`/poll/${pollId}`)
          return
        }

        const isCreator = pollData.creator.toLowerCase() === userAddress.toLowerCase()
        let isWhitelisted = false
        
        if (!isCreator) {
             isWhitelisted = await isUserWhitelisted(pollId, userAddress)
        }

        if (isCreator || isWhitelisted) {
          setCanMint(true)
        } else {
          setCanMint(false)
        }

        // Check ownership
        const userNFTs = await getUserNFTs(userAddress)
        const owned = userNFTs.some(nft => nft.name === `Poll #${pollId} Results`)
        setHasMinted(owned)

      } catch (error) {
        console.error('Failed to check eligibility:', error)
        toast.error('Failed to verify eligibility.')
      } finally {
        setLoading(false)
      }
    }

    checkEligibility()
  }, [pollId, userAddress, isConnected, router])

  const handleMint = async () => {
    if (!canMint) return
    setMinting(true)
    try {
      await mintResultNFT(pollId)
      setHasMinted(true)
      // Optional: Redirect or show success state
    } catch (error) {
      console.error("Minting failed", error)
    } finally {
      setMinting(false)
    }
  }

  if (loading) {
    return (
      <div className="pt-24 max-w-3xl mx-auto px-6 pb-32 text-center">
        <p className="text-gray-600">Verifying eligibility...</p>
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
  if (poll && !canMint) {
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
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-600 hover:text-black font-medium"
        >
          ← Back to Dashboard
        </button>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-white p-10 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-12 text-center"
      >
        <div className="mb-10 max-w-lg mx-auto">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
              className="text-6xl mb-6 inline-block"
            >
              🏆
            </motion.div>
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
              <span>✓</span> NFT Badge Minted Successfully
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
