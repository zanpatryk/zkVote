import { useState, useCallback } from 'react'
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group'
import { generateProof } from '@semaphore-protocol/proof'
import { useSignMessage, useAccount } from 'wagmi'
import { addMember, castVoteWithProof } from '@/lib/blockchain/engine/write'
import { getGroupMembers, getMerkleTreeDepth, hasVoted } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'

export function useSemaphore() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  const [identity, setIdentity] = useState(null)
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isCastingVote, setIsCastingVote] = useState(false)

  /**
   * Create or regenerate a deterministic identity for a specific poll.
   * The same wallet + pollId will ALWAYS produce the same identity.
   * No storage needed - can be regenerated anytime by signing.
   * 
   * @param {string|number} pollId - The poll ID to derive identity for
   * @returns {Promise<Identity|null>} The derived identity
   */
  const createIdentity = useCallback(async (pollId) => {
    if (!address) {
      toast.error('Connect wallet first')
      return null
    }

    if (!pollId) {
      toast.error('Poll ID required')
      return null
    }

    setIsLoadingIdentity(true)
    try {
      // Deterministic: same wallet + same pollId = same signature = same identity
      const message = `Sign to access your zkVote identity for Poll #${pollId}\n\nThis signature is used to derive your anonymous voting identity. It does not cost gas.`
      const signature = await signMessageAsync({ message })
      const newIdentity = new Identity(signature)
      
      setIdentity(newIdentity)
      toast.success('Identity generated!')
      return newIdentity
    } catch (error) {
      console.error('Failed to create identity:', error)
      toast.error('Failed to generate identity')
      return null
    } finally {
      setIsLoadingIdentity(false)
    }
  }, [address, signMessageAsync])

  // Register identity in the contract
  const register = useCallback(async (pollId, identityOverride) => {
    const activeIdentity = identityOverride || identity
    
    if (!activeIdentity) {
      toast.error('No identity found. Generate one first.')
      return
    }

    setIsRegistering(true)
    try {
      const success = await addMember(pollId, activeIdentity.commitment.toString())
      return success
    } catch (error) {
      console.error('Registration error:', error)
      // Error toast handled in registerVoter
      return false
    } finally {
      setIsRegistering(false)
    }
  }, [identity])

  // Generate ZK Proof (Semaphore)
  const generateVoteProof = useCallback(async (pollId, signal, identity) => {
    if (!identity) throw new Error('Identity required')
    
    // Ensure signal is valid (number or string-convertible)
    // generateProof expects message/signal.
    
    const { data: depth } = await getMerkleTreeDepth(pollId)
    const { data: membersData } = await getGroupMembers(pollId)
    
    const commitments = (membersData || []).map(m => m.identityCommitment).filter(Boolean)
    const group = new Group(commitments)
    
    const index = group.indexOf(identity.commitment)
    if (index === -1) {
        throw new Error('Your identity is not registered in this poll group.')
    }

    // generateProof(identity, group, message, scope, snarkArtifacts)
    let snarkArtifacts = undefined
    
    // Import constants locally to avoid top-level cyclic deps if any (though unlikely here)
    const { USE_LOCAL_SEMAPHORE_CIRCUITS, SEMAPHORE_CIRCUIT_WASM_PATH_TEMPLATE, SEMAPHORE_CIRCUIT_ZKEY_PATH_TEMPLATE } = await import('@/lib/constants')

    if (USE_LOCAL_SEMAPHORE_CIRCUITS) {
        snarkArtifacts = {
            wasmFilePath: SEMAPHORE_CIRCUIT_WASM_PATH_TEMPLATE.replace('{depth}', depth),
            zkeyFilePath: SEMAPHORE_CIRCUIT_ZKEY_PATH_TEMPLATE.replace('{depth}', depth)
        }
    }

    const proof = await generateProof(
      identity, 
      group, 
      signal, 
      pollId,
      depth,
      snarkArtifacts
    )
    return proof
  }, [])

  // Cast ZK Vote
  const castVote = useCallback(async (pollId, optionIndex, identity) => {
    if (!identity) {
      toast.error('Identity required to vote')
      return null
    }

    setIsCastingVote(true)
    try {
      toast.loading('Generating ZK Proof... (this may take a moment)', { id: 'vote' })
      
      const proof = await generateVoteProof(pollId, optionIndex, identity)

      // Call contract
      const result = await castVoteWithProof(pollId, { optionIndex }, proof)
      return result
    } catch (error) {
      // 1. Check if it's a known "Already Voted" error first
      const errorMessage = formatTransactionError(error)
      
      if (errorMessage.includes('already cast')) {
        toast.error(errorMessage, { id: 'vote' })
        return { alreadyVoted: true }
      }

      // 2. Log real unexpected errors
      console.error('ZK Vote failed:', error)
      toast.error(errorMessage, { id: 'vote' })
      
      return null
    } finally {
      setIsCastingVote(false)
    }
  }, [generateVoteProof])

  // Check if an identity has already voted in this poll
  const checkIdentityVoted = useCallback(async (pollId, identity) => {
    if (!identity || !pollId) return { voted: false }

    try {
      const { keccak256, pad, toHex, getAddress } = await import('viem')
      const { poseidon2 } = await import('poseidon-lite')
      
      // Calculate scope hash: keccak256(pollId) >> 8
      const scopeHash = BigInt(keccak256(pad(toHex(BigInt(pollId)), { size: 32 }))) >> 8n
      
      // Calculate manual nullifier hash: Poseidon(secretScalar, scopeHash)
      const manualNullifierHash = poseidon2([identity.secretScalar, scopeHash])
      
      // Derivation for voter address: uint160(nullifierHash)
      // Note: We use the full hash value and take last 160 bits
      const voterAddress = getAddress(`0x${(BigInt(manualNullifierHash) & ((1n << 160n) - 1n)).toString(16).padStart(40, '0')}`)
      
      const { data: voted } = await hasVoted(pollId, voterAddress)
      
      return { voted, voterAddress }
    } catch (error) {
      console.error('Failed to peek vote status:', error)
      return { voted: false, error }
    }
  }, [])

  // Download identity as JSON file
  const downloadIdentity = useCallback((identity, pollId) => {
    if (!identity) return

    try {
      // Create export object with pollId to allow automated routing
      const exportObject = {
        pollId: pollId.toString(),
        // Spread the identity internal values (privateKey/secret)
        // We use the identity's native toJSON (if available) or reconstruct essential parts
        ...identity, 
        // Explicitly include secret for easy reconstruction if ...identity doesn't catch private fields
        secret: identity.privateKey?.toString() || identity.secret?.toString() || identity.secretScalar?.toString()
      }

      // Serialize to JSON string, handling BigInt
      const identityString = JSON.stringify(exportObject, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2)
      
      const blob = new Blob([identityString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `zk-identity-poll-${pollId}.json`
      document.body.appendChild(link)
      link.click()
      
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download identity')
    }
  }, [])

  /**
   * Alias for createIdentity - makes the regeneration use case explicit.
   * Users can call this anytime to recover their identity by signing.
   */
  const regenerateIdentity = createIdentity

  return {
    identity,
    createIdentity,
    regenerateIdentity,
    register,
    castVote,
    generateVoteProof,
    downloadIdentity,
    isLoadingIdentity,
    isRegistering,
    isCastingVote,
    checkIdentityVoted
  }
}

