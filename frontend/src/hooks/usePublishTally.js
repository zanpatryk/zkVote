import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { votingSystemContract } from '@/lib/contracts'
import { publishEncryptedResults } from '@/lib/blockchain/engine/write'
import { decryptTally, generateTallyProof } from '@/lib/crypto/tally'
import { toast } from 'react-hot-toast'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'

export function usePublishTally(pollId) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [decryptedTally, setDecryptedTally] = useState(null)
  
  // Fetch Aggregated Ciphertexts from contract
  const { data: ciphertexts, refetch: refetchCiphertexts } = useReadContract({
    ...votingSystemContract,
    functionName: 'getAggregatedCiphertexts',
    args: [BigInt(pollId || 0)],
    query: { enabled: !!pollId }
  })

  const { refetchPollState } = usePollRegistry(pollId)

  const publishTally = async (sk) => {
    if (!sk) {
      throw new Error('Please enter the Secret Key')
    }
    if (!ciphertexts) {
      throw new Error('Ciphertexts not loaded')
    }

    setIsProcessing(true)
    const toastId = toast.loading('Decrypting votes...')

    try {
      // 1. Decrypt tally
      const { tally, publicKey, ciphertexts: formattedCts } = await decryptTally(ciphertexts, sk)
      setDecryptedTally(tally)
      
      // 2. Generate ZK proof
      toast.loading('Generating ZK Proof of Decryption...', { id: toastId })
      const proof = await generateTallyProof(tally, publicKey, formattedCts, sk)
      
      // 3. Publish to blockchain
      toast.loading('Publishing results...', { id: toastId })
      await publishEncryptedResults(pollId, tally, proof)
      
      toast.success('Results published!', { id: toastId })
      await refetchPollState()
      
      return tally
    } catch (error) {
      console.error('Decryption/Publishing failed:', error)
      toast.error(formatTransactionError(error, 'Decryption or publishing failed'), { id: toastId })
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    publishTally,
    isProcessing,
    decryptedTally,
    ciphertexts,
    refetchCiphertexts
  }
}
