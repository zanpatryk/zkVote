import { renderHook, act, waitFor } from '@testing-library/react'
import { useSemaphore } from './useSemaphore'
import { useSignMessage, useAccount } from 'wagmi'
import { addMember, castVoteWithProof } from '@/lib/blockchain/engine/write'
import { getGroupMembers, getMerkleTreeDepth, hasVoted } from '@/lib/blockchain/engine/read'
import toast from 'react-hot-toast'
import { Identity } from '@semaphore-protocol/identity'

// Mock dependencies
jest.mock('wagmi', () => ({
  useSignMessage: jest.fn(),
  useAccount: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  addMember: jest.fn(),
  castVoteWithProof: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getGroupMembers: jest.fn(),
  getMerkleTreeDepth: jest.fn(),
  hasVoted: jest.fn(),
}))

jest.mock('react-hot-toast', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
  }
})

jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn(),
}))

jest.mock('@semaphore-protocol/group', () => ({
  Group: jest.fn(),
}))

jest.mock('@semaphore-protocol/proof', () => ({
  generateProof: jest.fn(),
}))

jest.mock('viem', () => ({
  keccak256: jest.fn(() => '0x123456'),
  pad: jest.fn(),
  toHex: jest.fn(),
  getAddress: jest.fn(addr => addr),
}))

jest.mock('poseidon-lite', () => ({
  poseidon2: jest.fn(() => '12345'),
}))

jest.mock('@/lib/constants', () => ({
  get USE_LOCAL_SEMAPHORE_CIRCUITS() { return global.mockUseLocalCircuits },
  SEMAPHORE_CIRCUIT_WASM_PATH_TEMPLATE: '/wasm/{depth}.wasm',
  SEMAPHORE_CIRCUIT_ZKEY_PATH_TEMPLATE: '/zkey/{depth}.zkey',
}))

describe('useSemaphore', () => {
  const mockSignMessageAsync = jest.fn()
  const mockIdentityInstance = { 
    commitment: { toString: () => '123' },
    toString: () => 'identity-string',
    secretScalar: 'secret' 
  }

    beforeEach(() => {
      jest.clearAllMocks()
      global.mockUseLocalCircuits = false
      useAccount.mockReturnValue({ address: '0x123', isConnected: true })
      useSignMessage.mockReturnValue({ signMessageAsync: mockSignMessageAsync })
      Identity.mockImplementation(() => mockIdentityInstance)
      addMember.mockResolvedValue({})
    })
    


  it('should return initial state', () => {
    const { result } = renderHook(() => useSemaphore())
    
    expect(result.current.identity).toBeNull()
    expect(result.current.isLoadingIdentity).toBe(false)
    expect(result.current.isRegistering).toBe(false)
  })

  describe('createIdentity', () => {
    it('should fail if wallet is not connected', async () => {
      useAccount.mockReturnValue({ address: null })
      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
        const identity = await result.current.createIdentity('poll-123')
        expect(identity).toBeNull()
      })

      expect(toast.error).toHaveBeenCalledWith('Connect wallet first')
      expect(mockSignMessageAsync).not.toHaveBeenCalled()
    })

    it('should create identity successfully with pollId', async () => {
      mockSignMessageAsync.mockResolvedValue('signature')
      const { result } = renderHook(() => useSemaphore())

      let identity
      await act(async () => {
        identity = await result.current.createIdentity('poll-123')
      })

      expect(mockSignMessageAsync).toHaveBeenCalledWith({
        message: 'Sign to access your zkVote identity for Poll #poll-123\n\nThis signature is used to derive your anonymous voting identity. It does not cost gas.'
      })
      expect(Identity).toHaveBeenCalledWith('signature')
      expect(result.current.identity).toBe(mockIdentityInstance)
      expect(identity).toBe(mockIdentityInstance)
      expect(toast.success).toHaveBeenCalledWith('Identity generated!')
    })

    it('should handle signing errors', async () => {
      mockSignMessageAsync.mockRejectedValue(new Error('User rejected'))
      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
        const identity = await result.current.createIdentity('poll-123')
        expect(identity).toBeNull()
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to generate identity')
      expect(result.current.identity).toBeNull()
    })

    it('should fail if pollId is not provided', async () => {
      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
        const identity = await result.current.createIdentity()
        expect(identity).toBeNull()
      })

      expect(toast.error).toHaveBeenCalledWith('Poll ID required')
    })
  })

  describe('register', () => {
    it('should fail if no identity exists', async () => {
      const { result } = renderHook(() => useSemaphore())
      
      await act(async () => {
        await result.current.register('poll-123')
      })

      expect(toast.error).toHaveBeenCalledWith('No identity found. Generate one first.')
      expect(addMember).not.toHaveBeenCalled()
    })

    it('should register successfully', async () => {
      mockSignMessageAsync.mockResolvedValue('signature')
      const { result } = renderHook(() => useSemaphore())

      // First create identity
      await act(async () => {
        await result.current.createIdentity('poll-123')
      })

      // Then register
      await act(async () => {
        await result.current.register('poll-123')
      })

      expect(addMember).toHaveBeenCalledWith('poll-123', '123')
    })

    it('should handle registration error', async () => {
      mockSignMessageAsync.mockResolvedValue('signature')
      addMember.mockRejectedValue(new Error('Contract error'))
      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
        await result.current.createIdentity('poll-123')
      })

      await act(async () => {
        await result.current.register('poll-123')
      })

      expect(addMember).toHaveBeenCalled()
      expect(result.current.isRegistering).toBe(false)
    })
  })

  describe('castVote', () => {
    const mockGroupInstance = {
      addMembers: jest.fn(),
      indexOf: jest.fn(),
    }
    const mockProof = { pi_a: [], pi_b: [], pi_c: [], protocol: "groth16" }

    beforeEach(() => {
      const { Group } = require('@semaphore-protocol/group')
      const { generateProof } = require('@semaphore-protocol/proof')
      const { getMerkleTreeDepth, getGroupMembers } = require('@/lib/blockchain/engine/read')

      Group.mockImplementation(() => mockGroupInstance)
      generateProof.mockResolvedValue(mockProof)
      getMerkleTreeDepth.mockResolvedValue({ data: 20, error: null })
      getGroupMembers.mockResolvedValue({
        data: [
          { identityCommitment: 'member1', transactionHash: '0x1', blockNumber: 100 },
          { identityCommitment: 'member2', transactionHash: '0x2', blockNumber: 101 }
        ],
        error: null
      })
      mockGroupInstance.indexOf.mockReturnValue(0)
    })

    it('should fail if no identity is provided', async () => {
      const { result } = renderHook(() => useSemaphore())
      await act(async () => {
         const res = await result.current.castVote('poll-1', 0, null)
         expect(res).toBeNull()
      })
      expect(toast.error).toHaveBeenCalledWith('Identity required to vote')
    })

    it('should fail if identity is not in group', async () => {
      mockGroupInstance.indexOf.mockReturnValue(-1)
      const { result } = renderHook(() => useSemaphore())
      
      await act(async () => {
         const res = await result.current.castVote('poll-1', 0, mockIdentityInstance)
         expect(res).toBeNull()
      })
      
      expect(toast.error).toHaveBeenCalledWith('Your identity is not registered in this poll group.', { id: 'vote' })
    })

    it('should cast vote successfully', async () => {
      castVoteWithProof.mockResolvedValue({ voteId: 1, txHash: '0xhash' })
      const { result } = renderHook(() => useSemaphore())

      let res
      await act(async () => {
         res = await result.current.castVote('poll-1', 1, mockIdentityInstance)
      })

      const { generateProof } = require('@semaphore-protocol/proof')
      
      expect(generateProof).toHaveBeenCalledWith(
        mockIdentityInstance,
        mockGroupInstance,
        1,
        'poll-1',
        20,
        undefined
      )
      expect(castVoteWithProof).toHaveBeenCalledWith('poll-1', { optionIndex: 1 }, mockProof)
      expect(res).toEqual({ voteId: 1, txHash: '0xhash' })
    })

    it('should use local artifacts if configured', async () => {
      castVoteWithProof.mockResolvedValue({ voteId: 1, txHash: '0xhash' })
      
      // Override mock for this test
      global.mockUseLocalCircuits = true

      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
         await result.current.castVote('poll-1', 1, mockIdentityInstance)
      })

      const { generateProof } = require('@semaphore-protocol/proof')
      
      expect(generateProof).toHaveBeenCalledWith(
        mockIdentityInstance,
        mockGroupInstance,
        1,
        'poll-1',
        20,
        {
            wasmFilePath: '/wasm/20.wasm',
            zkeyFilePath: '/zkey/20.zkey'
        }
      )
      

    })

    it('should handle proof generation error', async () => {
      const { generateProof } = require('@semaphore-protocol/proof')
      generateProof.mockRejectedValue(new Error('Proof failed'))
      
      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
         const res = await result.current.castVote('poll-1', 0, mockIdentityInstance)
         expect(res).toBeNull()
      })

      expect(toast.error).toHaveBeenCalledWith('Proof failed', { id: 'vote' })
      expect(result.current.isCastingVote).toBe(false)
    })

    it('should handle contract error', async () => {
      castVoteWithProof.mockRejectedValue(new Error('Contract failed'))
      
      const { result } = renderHook(() => useSemaphore())

      await act(async () => {
         const res = await result.current.castVote('poll-1', 0, mockIdentityInstance)
         expect(res).toBeNull()
      })

      expect(toast.error).toHaveBeenCalledWith('Contract failed', { id: 'vote' })
    })
  })

  describe('downloadIdentity', () => {
    beforeEach(() => {
       global.URL.createObjectURL = jest.fn(() => 'blob:url')
       global.URL.revokeObjectURL = jest.fn()
    })

    afterEach(() => {
       jest.restoreAllMocks()
    })

    it('should download identity as JSON', () => {
       const { result } = renderHook(() => useSemaphore())
       
       const mockLink = {
         href: '',
         download: '',
         click: jest.fn(),
       }
       const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink)
       const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {})
       const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {})
       
       act(() => {
         result.current.downloadIdentity(mockIdentityInstance, '123')
       })

       expect(createElementSpy).toHaveBeenCalledWith('a')
       expect(mockLink.href).toBe('blob:url')
       expect(mockLink.download).toBe('zk-identity-poll-123.json')
       expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
       expect(mockLink.click).toHaveBeenCalled()
       expect(removeChildSpy).toHaveBeenCalledWith(mockLink)
    })

    it('should handle download errors', () => {
       const { result } = renderHook(() => useSemaphore())
       global.URL.createObjectURL.mockImplementation(() => { throw new Error('Blob error') })
       
       act(() => {
         result.current.downloadIdentity(mockIdentityInstance, '123')
       })

       expect(toast.error).toHaveBeenCalledWith('Failed to download identity')
    })
  })

  describe('regenerateIdentity', () => {
    it('should be an alias for createIdentity', () => {
      const { result } = renderHook(() => useSemaphore())
      expect(result.current.regenerateIdentity).toBe(result.current.createIdentity)
    })

    it('should regenerate the same identity for the same pollId', async () => {
      mockSignMessageAsync.mockResolvedValue('same-signature')
      const { result } = renderHook(() => useSemaphore())

      let identity1, identity2
      await act(async () => {
        identity1 = await result.current.createIdentity('poll-123')
      })
      await act(async () => {
        identity2 = await result.current.regenerateIdentity('poll-123')
      })

      // Both calls should produce the same identity (mocked)
      expect(identity1).toBe(mockIdentityInstance)
      expect(identity2).toBe(mockIdentityInstance)
    })
  })


  describe('checkIdentityVoted', () => {
     it('should return false if invalid params', async () => {
         const { result } = renderHook(() => useSemaphore())
         const res = await result.current.checkIdentityVoted(null, null)
         expect(res).toEqual({ voted: false })
     })

     it('should detect if voted', async () => {
         const { result } = renderHook(() => useSemaphore())
         // hasVoted mock setup
         const { hasVoted } = require('@/lib/blockchain/engine/read')
         hasVoted.mockResolvedValue({ data: true, error: null })

         const res = await result.current.checkIdentityVoted('123', { secretScalar: '123' })
         
         expect(res.voted).toBe(true)
         expect(res.voterAddress).toBeDefined()
     })

     it('should handle errors in checkIdentityVoted gracefully', async () => {
         const { result } = renderHook(() => useSemaphore())
         // Force error by mocking hasVoted to reject
         const { hasVoted } = require('@/lib/blockchain/engine/read')
         hasVoted.mockRejectedValue(new Error('RPC Error'))

         const res = await result.current.checkIdentityVoted('123', { secretScalar: '123' })
         
         expect(res.voted).toBe(false)
         expect(res.error).toBeDefined()
     })
  })

  describe('castVote error handling - Already Cast', () => {
    it('should return alreadyVoted: true when contract error says so', async () => {
      castVoteWithProof.mockRejectedValue(new Error('user already cast a vote'))
      
      const { result } = renderHook(() => useSemaphore())

      let res
      await act(async () => {
         res = await result.current.castVote('poll-1', 0, mockIdentityInstance)
      })

      expect(res).toEqual({ alreadyVoted: true })
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('already cast'), expect.any(Object))
    })
  })
})
