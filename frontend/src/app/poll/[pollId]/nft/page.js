"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById, isUserWhitelisted, getUserNFTs } from '@/lib/blockchain/engine/read'
import { mintResultNFT } from '@/lib/blockchain/engine/write'
import PollDetails from '@/components/PollDetails'
import { toast } from 'react-hot-toast'

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Mint Result NFT</h1>
        <button 
          onClick={() => router.push('/poll')}
          className="text-gray-600 hover:text-black"
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Commemorative Result NFT</h2>
            <p className="text-gray-500">
                This poll has ended. As a participant or creator, you can mint an NFT containing the final results.
            </p>
        </div>

        <div className="flex justify-center">
          {!hasMinted ? (
             <button
            onClick={handleMint}
            disabled={minting}
            className="px-8 py-3 bg-black text-white text-lg rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-lg"
          >
            {minting ? 'Minting...' : 'Mint Result NFT'}
          </button>
          ) : (
            <div className="text-black font-bold text-lg border-2 border-black bg-white px-6 py-3 rounded-xl shadow-sm">
              ✓ NFT Badge Minted
            </div>
          )}
        </div>
      </div>

      {hasMinted && (
        <div className="opacity-75">
          <h3 className="text-xl font-semibold mb-4 text-gray-400">Final Results Snapshot</h3>
          <PollDetails pollId={pollId} showResults={true} />
        </div>
      )}
    </div>
  )
}
