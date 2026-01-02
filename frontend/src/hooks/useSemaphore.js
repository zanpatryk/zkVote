import { useState, useCallback } from 'react'
import { Identity } from '@semaphore-protocol/identity'
import { Group } from '@semaphore-protocol/group'
import { generateProof } from '@semaphore-protocol/proof'
import { useSignMessage, useAccount } from 'wagmi'
import { registerVoter, castVoteWithProof } from '@/lib/blockchain/engine/write'
import { getGroupMembers, getMerkleTreeDepth } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import { toastTransactionError } from '@/lib/blockchain/utils/error-handler'

export function useSemaphore() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  
  const [identity, setIdentity] = useState(null)
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isCastingVote, setIsCastingVote] = useState(false)

  // Create deterministic identity based on wallet signature
  const createIdentity = useCallback(async () => {
    if (!address) {
      toast.error('Connect wallet first')
      return null
    }

    setIsLoadingIdentity(true)
    try {
      const message = 'Sign this message to generate your voting identity. This does not cost gas.'
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
      await registerVoter(pollId, activeIdentity.commitment.toString())
    } catch (error) {
      console.error('Registration error:', error)
      // Error toast handled in registerVoter
    } finally {
      setIsRegistering(false)
    }
  }, [identity])

  // Cast ZK Vote
  const castVote = useCallback(async (pollId, optionIndex, identity) => {
    if (!identity) {
      toast.error('Identity required to vote')
      return null
    }

    setIsCastingVote(true)
    try {
      const depth = await getMerkleTreeDepth(pollId)
      const membersData = await getGroupMembers(pollId)
      
      // Map member objects to identity commitments (strings/BigInts) for Semaphore Group
      const commitments = membersData.map(m => m.identityCommitment).filter(Boolean)
      
      const group = new Group(commitments)
      
      // Verify the identity is in the group (client-side check)
      const index = group.indexOf(identity.commitment)
      if (index === -1) {
          throw new Error('Your identity is not registered in this poll group.')
      }

      toast.loading('Generating ZK Proof... (this may take a moment)', { id: 'vote' })
      
      // generateProof(identity, group, message, scope, snarkArtifacts)
      // generateProof(identity, group, message, scope, snarkArtifacts)
      const proof = await generateProof(
        identity, 
        group, 
        optionIndex, 
        pollId,
        depth
      )

      // Call contract
      const result = await castVoteWithProof(pollId, { optionIndex }, proof)
      return result
    } catch (error) {
      console.error('ZK Vote failed:', error)
      
      const message = toastTransactionError(error, 'Failed to cast ZK vote', { id: 'vote' })
      
      if (message.includes('already cast')) {
        return { alreadyVoted: true }
      }
      
      return null
    } finally {
      setIsCastingVote(false)
    }
  }, []) // No dependencies needed as arguments are passed

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
      
      console.log('Peeking vote status for derived address:', voterAddress)
      console.log('On-chain result for peek:', voted)
      
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
      // Serialize identity to JSON string, handling BigInt if necessary
      const identityString = JSON.stringify(identity, (key, value) => 
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

  // Storage Persistence Helpers
  const saveIdentityToStorage = useCallback((identity, pollId) => {
    if (!identity || !pollId) return
    try {
      const data = JSON.stringify(identity, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      )
      localStorage.setItem(`zk-identity-${pollId}`, data)
    } catch (error) {
      console.error('Failed to save identity to storage:', error)
    }
  }, [])

  const loadIdentityFromStorage = useCallback((pollId) => {
    if (!pollId) return null
    try {
      const data = localStorage.getItem(`zk-identity-${pollId}`)
      if (!data) return null
      
      // Since Identity constructor expects a private key or a serialized state, 
      // but the '@semaphore-protocol/identity' Identity class can be reconstructed 
      // from its private key. Our serialization saved the whole object.
      // We need the private key to truly "reconstruct" it with methods.
      const parsed = JSON.parse(data)
      const privateKey = parsed._privateKey || parsed.privateKey || parsed.secret
      
      if (!privateKey) {
        console.warn('Stored identity missing private key')
        return null
      }
      
      return new Identity(privateKey)
    } catch (error) {
      console.error('Failed to load identity from storage:', error)
      return null
    }
  }, [])

  const hasStoredIdentity = useCallback((pollId) => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem(`zk-identity-${pollId}`)
  }, [])

  return {
    identity,
    createIdentity,
    register,
    castVote,
    downloadIdentity,
    saveIdentityToStorage,
    loadIdentityFromStorage,
    hasStoredIdentity,
    isLoadingIdentity,
    isRegistering,
    isCastingVote
  }
}
