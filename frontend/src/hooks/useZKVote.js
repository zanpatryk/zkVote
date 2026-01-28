'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSemaphore } from './useSemaphore'
import { usePollRegistry } from './usePollRegistry'
import { elgamal, proof as proofUtils } from '@zkvote/lib'
import { useAccount } from 'wagmi'
import { castEncryptedVote, castPlainVote, castEncryptedVoteWithProof } from '@/lib/blockchain/engine/write'
import { getPollPublicKey } from '@/lib/blockchain/engine/read'
import { ELGAMAL_VECTOR_SIZE, VOTE_CIRCUIT_WASM_PATH, VOTE_CIRCUIT_ZKEY_PATH } from '@/lib/constants'
import { toast } from 'react-hot-toast'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'
import { buildSponsoredVoteUserOp, sendSponsoredPlainVote } from '@/lib/accountAbstraction/userOp'


export function useZKVote(pollId) {
  const { address } = useAccount()
  const { isZK, isRegistered, voteStorageAddress } = usePollRegistry(pollId)
  const { castVote: castSemaphoreVote, generateVoteProof } = useSemaphore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState([])
  const [pollPk, setPollPk] = useState(null)

  // Fetch Poll Public Key if it's a secret poll
  useEffect(() => {
    async function fetchKey() {
      if (!pollId || !voteStorageAddress) return
      
      // Attempt to fetch key regardless of isZK flag
      // Non-secret polls will simply return null data
      const { data } = await getPollPublicKey(pollId)
      if (data) setPollPk(data)
    }
    fetchKey()
  }, [pollId, voteStorageAddress])

  const submitVote = useCallback(async (optionIndex, identity) => {
    if (!pollId) return
    setIsSubmitting(true)

    // 1. Determine steps based on poll type
    const isSecret = !!pollPk
    const isAnonymous = isZK

    const newSteps = []
    if (isAnonymous) newSteps.push('Authenticating Identity')
    if (isSecret) {
        newSteps.push('Encrypting Vote Vector')
        newSteps.push('Generating Secrecy Proof')
    }
    newSteps.push('Submitting to Blockchain')
    
    setSteps(newSteps)
    setCurrentStep(0)

    try {
      let result;

      if (isSecret) {
        // --- SECRET VOTE FLOW (ElGamal) ---
        await elgamal.init()
        
        // Handle step progress
        let stepIdx = 0
        let semaphoreData = null

        if (isAnonymous) {
            setCurrentStep(stepIdx++) // Step 0: Auth
             // For secret voting, the signal to Semaphore is 0 (blinded)
             const p = await generateVoteProof(pollId, 0, identity)
             semaphoreData = {
                 proof: p.points || p.proof,
                 nullifier: p.nullifier || p.nullifierHash
             }
        }

        // Step: Encrypt
        setCurrentStep(stepIdx++)
        
        const voteVector = new Array(ELGAMAL_VECTOR_SIZE).fill(0n)
        voteVector[optionIndex] = 1n
        
        const randoms = new Array(ELGAMAL_VECTOR_SIZE).fill(0n).map(() => elgamal.randomScalar())
        const ciphertexts = voteVector.map((v, i) => elgamal.encrypt(pollPk, v, randoms[i]))
        
        // Flatten ciphertexts for circuit: [C1x, C1y, C2x, C2y] * ELGAMAL_VECTOR_SIZE
        const flattenedEnc = []
        ciphertexts.forEach(ct => {
          flattenedEnc.push(ct.c1[0], ct.c1[1], ct.c2[0], ct.c2[1])
        })

        // Step: Prove
        setCurrentStep(stepIdx++)
        
        const input = {
          pk: [BigInt(pollPk[0]), BigInt(pollPk[1])],
          vote: voteVector,
          r: randoms
        }

        const snarkArtifacts = {
          wasmFilePath: VOTE_CIRCUIT_WASM_PATH,
          zkeyFilePath: VOTE_CIRCUIT_ZKEY_PATH
        }

        const { proof, publicSignals } = await proofUtils.generateProof(input, snarkArtifacts)
        const formattedProof = proofUtils.formatProofForSolidity(proof)

        // Circuit outputs: encVote (64 elements)
        // Circuit inputs: pk (2 elements) -> these are at the END of publicSignals
        const circuitEncVote = publicSignals.slice(0, 64)

        // Step: Submit
        setCurrentStep(newSteps.length - 1)
        const toastId = toast.loading('Submitting vote...', { id: 'vote' })
        
        try {
            if (isAnonymous && semaphoreData) {
                // Unified Submit (Secret + Anonymous)
                 result = await castEncryptedVoteWithProof(
                     pollId, 
                     semaphoreData.nullifier, 
                     semaphoreData.proof, 
                     circuitEncVote, 
                     formattedProof
                 )
                 result.nullifier = semaphoreData.nullifier
            } else {
                 result = await castEncryptedVote(pollId, circuitEncVote, formattedProof)
            }
            toast.success('Vote submitted successfully!', { id: toastId })
        } catch (err) {
            const msg = formatTransactionError(err)
            toast.error(msg, { id: toastId })
            err.isHandled = true
            throw err
        }

        // Return structured result for receipt compatibility
        return {
          ...result,
          proof: JSON.stringify(formattedProof)
        }
      } else if (isAnonymous) {
        // --- ANONYMOUS ONLY FLOW (Semaphore) ---
        setCurrentStep(0)
        // castSemaphoreVote handles its own toasts
        result = await castSemaphoreVote(pollId, optionIndex, identity)
        setCurrentStep(newSteps.length - 1)
      } else {
        // --- PLAIN VOTE FLOW ---
        setCurrentStep(0)
        const toastId = toast.loading('Submitting vote...', { id: 'vote' })
        try {
          if (!address) {
            throw new Error('Wallet account not connected')
          }

          // Build unsigned UserOperation for this poll + option, preserving EOA voter identity
          const { userOp, entryPoint } = await buildSponsoredVoteUserOp({
            pollId,
            optionIdx: optionIndex,
            voterAddress: address,
          })

          // Submit unsigned UserOperation to the backend bundler
          const { txHash, voteId } = await sendSponsoredPlainVote({
            userOp,
            entryPoint,
          })
          result = { voteId: voteId ?? null, txHash }

          toast.success('Vote submitted successfully!', { id: toastId })
        } catch (err) {
          const msg = formatTransactionError(err)
          toast.error(msg, { id: toastId })
          err.isHandled = true
          throw err
        }
      }

      return result
    } catch (error) {
      console.warn('Unified Vote failed:', error)
      
      // If error hasn't been handled (toasted) yet, do it now
      if (!error.isHandled && !error?.message?.includes('User rejected')) {
            const msg = formatTransactionError(error)
            toast.error(msg)
      }
      
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [pollId, isZK, voteStorageAddress, pollPk, castSemaphoreVote])

  return {
    submitVote,
    isSubmitting,
    currentStep,
    steps,
    pollPk
  }
}
