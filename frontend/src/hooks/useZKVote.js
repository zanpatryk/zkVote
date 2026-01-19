'use client'

import { useState, useCallback } from 'react'
import { useSemaphore } from './useSemaphore'
import { usePollRegistry } from './usePollRegistry'
import { elgamal, proof as proofUtils } from '@zkvote/lib'
import { useReadContract, useAccount } from 'wagmi'
import { castEncryptedVote, castPlainVote, castEncryptedVoteWithProof } from '@/lib/blockchain/engine/write'
import ZKElGamalVoteVectorABI from '@/lib/contracts/abis/ZKElGamalVoteVector.json'
import { ELGAMAL_VECTOR_SIZE } from '@/lib/constants'
import { toast } from 'react-hot-toast'
import * as snarkjs from 'snarkjs'

export function useZKVote(pollId) {
  const { address } = useAccount()
  const { isZK, isRegistered, voteStorageAddress } = usePollRegistry(pollId)
  const { castVote: castSemaphoreVote, generateVoteProof } = useSemaphore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState([])

  // Fetch Poll Public Key if it's a secret poll
  const { data: pollPk } = useReadContract({
    address: voteStorageAddress,
    abi: ZKElGamalVoteVectorABI,
    functionName: 'getPollPublicKey',
    args: [BigInt(pollId || 0)],
    query: { 
      enabled: !!voteStorageAddress && !!pollId && voteStorageAddress !== '0x0000000000000000000000000000000000000000',
      retry: false
    }
  })

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
                 // write.js expects 'points' and 'nullifier' based on existing working code
                 // But we support standard 'proof'/'nullifierHash' too just in case
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

        const wasmPath = `/circuits/elgamalVoteVector_N16/elGamalVoteVector_N16.wasm`
        const zkeyPath = `/circuits/elgamalVoteVector_N16/elGamalVoteVector_N16_final.zkey`

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath)
        const formattedProof = proofUtils.formatProofForSolidity(proof)

        // Use the encVote from publicSignals to ensure it matches the proof exactly!
        // Circuit outputs: encVote (64 elements)
        // Circuit inputs: pk (2 elements) -> these are at the END of publicSignals
        const circuitEncVote = publicSignals.slice(0, 64)

        // Step: Submit
        setCurrentStep(newSteps.length - 1)
        
        if (isAnonymous && semaphoreData) {
            // Unified Submit (Secret + Anonymous)
             result = await castEncryptedVoteWithProof(
                 pollId, 
                 semaphoreData.nullifier, 
                 semaphoreData.proof, 
                 circuitEncVote, 
                 formattedProof
             )
             // result already has txHash, voteId. Append nullifier for receipt.
             result.nullifier = semaphoreData.nullifier
        } else {
             // Secret Only (Not Anonymous? e.g. Whitelisted but Public identity)
             // Currently system enforces Whitelist -> Anonymous via Semaphore?
             // Or maybe just Whitelisted address check?
             // If !isZK, isAnonymous is false.
             // If isZK but not Secret, we use else block.
             // If Secret but not ZK? Is that possible? 
             // Yes, VoteStorage=ElGamal, Eligibility=AllowList (without Semaphore).
             // In that case s_pollEligibility.isWhitelisted(msg.sender) check is passed by Engine. (See Engine logic).
             // So castEncryptedVote is correct.
             result = await castEncryptedVote(pollId, circuitEncVote, formattedProof)
        }

        // Return structured result for receipt compatibility
        return {
          ...result,
          proof: JSON.stringify(formattedProof)
        }
      } else if (isAnonymous) {
        // --- ANONYMOUS ONLY FLOW (Semaphore) ---
        setCurrentStep(0)
        result = await castSemaphoreVote(pollId, optionIndex, identity)
        setCurrentStep(newSteps.length - 1)
      } else {
        // --- PLAIN VOTE FLOW ---
        setCurrentStep(0)
        result = await castPlainVote(pollId, optionIndex)
        // No receipt proof for plain vote
        // But result has voteId and txHash.
      }

      return result
    } catch (error) {
      console.error('Unified Vote failed:', error)
      // toast is usually handled by castEncryptedVote / castSemaphoreVote
      throw error
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
