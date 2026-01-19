import { renderHook, act, waitFor } from '@testing-library/react'
import { useZKVote } from './useZKVote'
import { useSemaphore } from './useSemaphore'
import { usePollRegistry } from './usePollRegistry'
import { useReadContract, useAccount } from 'wagmi'
import { elgamal, proof as proofUtils } from '@zkvote/lib'
import { castEncryptedVote, castPlainVote, castEncryptedVoteWithProof } from '@/lib/blockchain/engine/write'
import * as snarkjs from 'snarkjs'

// Mocks
jest.mock('./useSemaphore', () => ({
  useSemaphore: jest.fn()
}))

jest.mock('./usePollRegistry', () => ({
  usePollRegistry: jest.fn()
}))

jest.mock('wagmi', () => ({
  useReadContract: jest.fn(),
  useAccount: jest.fn(),
}))

jest.mock('@zkvote/lib', () => ({
  elgamal: {
    init: jest.fn(),
    randomScalar: jest.fn(),
    encrypt: jest.fn(),
  },
  proof: {
    formatProofForSolidity: jest.fn(),
  }
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  castEncryptedVote: jest.fn(),
  castPlainVote: jest.fn(),
  castEncryptedVoteWithProof: jest.fn(),
}))

jest.mock('snarkjs', () => ({
  groth16: {
    fullProve: jest.fn(),
  }
}))

describe('useZKVote', () => {
  const mockPollId = '123'
  const mockIdentity = { commitment: '123' }

  const mockCastSemaphoreVote = jest.fn()
  const mockGenerateVoteProof = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    useAccount.mockReturnValue({ address: '0xUser' })

    useSemaphore.mockReturnValue({
      castVote: mockCastSemaphoreVote,
      generateVoteProof: mockGenerateVoteProof,
    })

    usePollRegistry.mockReturnValue({
      isZK: false,
      isRegistered: false,
      voteStorageAddress: '0xVoteStorage',
    })

    useReadContract.mockReturnValue({ data: undefined }) // Default no Poll Key (Plain vote)

    // Setup elgamal mocks
    elgamal.init.mockResolvedValue(undefined)
    elgamal.randomScalar.mockReturnValue(123n)
    elgamal.encrypt.mockReturnValue({ c1: [1n, 2n], c2: [3n, 4n] })
    
    // Setup snarkjs mock
    snarkjs.groth16.fullProve.mockResolvedValue({
        proof: { pi_a: [], pi_b: [], pi_c: [] },
        publicSignals: new Array(66).fill('1') // 64 encVote + 2 pk
    })

    // Setup proof utils
    proofUtils.formatProofForSolidity.mockReturnValue([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('should return initial state', () => {
    const { result } = renderHook(() => useZKVote(mockPollId))
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.currentStep).toBe(0)
    expect(result.current.steps).toEqual([])
  })

  it('should handle Plain Vote flow', async () => {
    // isZK = false, no pollPk
    castPlainVote.mockResolvedValue({ txHash: '0xPlain' })

    const { result } = renderHook(() => useZKVote(mockPollId))

    let submitRes
    await act(async () => {
      submitRes = await result.current.submitVote(1, null)
    })

    expect(castPlainVote).toHaveBeenCalledWith(mockPollId, 1)
    expect(submitRes).toEqual({ txHash: '0xPlain' })
    expect(result.current.steps).toContain('Submitting to Blockchain')
  })

  it('should handle Anonymous Only Vote flow (Semaphore)', async () => {
    usePollRegistry.mockReturnValue({
        isZK: true,
        isRegistered: true,
        voteStorageAddress: '0x0000000000000000000000000000000000000000', // No secret storage
    })
    // No Poll PK
    useReadContract.mockReturnValue({ data: undefined })

    mockCastSemaphoreVote.mockResolvedValue({ txHash: '0xSem' })

    const { result } = renderHook(() => useZKVote(mockPollId))

    let submitRes
    await act(async () => {
      submitRes = await result.current.submitVote(1, mockIdentity)
    })

    expect(mockCastSemaphoreVote).toHaveBeenCalledWith(mockPollId, 1, mockIdentity)
    expect(submitRes).toEqual({ txHash: '0xSem' })
    expect(result.current.steps).toContain('Authenticating Identity')
  })

  it('should handle Secret Vote flow (ElGamal only)', async () => {
    // Plain + Secret (e.g. Whitelisted but Secret)
    // pollPk present
    useReadContract.mockReturnValue({ data: [123n, 456n] }) 
    
    castEncryptedVote.mockResolvedValue({ txHash: '0xSecret' })

    const { result } = renderHook(() => useZKVote(mockPollId))

    let submitRes
    await act(async () => {
      submitRes = await result.current.submitVote(0, null)
    })

    expect(elgamal.init).toHaveBeenCalled()
    expect(elgamal.encrypt).toHaveBeenCalledTimes(16) // N=16
    expect(snarkjs.groth16.fullProve).toHaveBeenCalled()
    
    expect(castEncryptedVote).toHaveBeenCalledWith(
        mockPollId, 
        expect.any(Array), // circuitEncVote
        expect.any(Array)  // formattedProof
    )
    expect(submitRes).toEqual({ 
        txHash: '0xSecret', 
        proof: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]) 
    })
    expect(result.current.steps).toEqual([
        'Encrypting Vote Vector',
        'Generating Secrecy Proof',
        'Submitting to Blockchain'
    ])
  })

  it('should handle Unified Vote flow (Anonymous + Secret)', async () => {
    usePollRegistry.mockReturnValue({
        isZK: true,
        isRegistered: true,
        voteStorageAddress: '0xVoteStorage',
    })
    useReadContract.mockReturnValue({ data: [123n, 456n] }) 

    // Mock Semaphore proof generation for binding
    mockGenerateVoteProof.mockResolvedValue({
        proof: [1,2,3],
        nullifier: '0xNullifier'
    })

    castEncryptedVoteWithProof.mockResolvedValue({ txHash: '0xUnified' })

    const { result } = renderHook(() => useZKVote(mockPollId))

    let submitRes
    await act(async () => {
      submitRes = await result.current.submitVote(0, mockIdentity)
    })

    expect(mockGenerateVoteProof).toHaveBeenCalledWith(mockPollId, 0, mockIdentity)
    expect(castEncryptedVoteWithProof).toHaveBeenCalledWith(
        mockPollId,
        '0xNullifier',
        [1,2,3], // semaphore proof
        expect.any(Array), // enc votes
        expect.any(Array) // secrecy proof
    )

    expect(submitRes).toEqual({ 
        txHash: '0xUnified', 
        nullifier: '0xNullifier', 
        proof: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8])
    })
    
    expect(result.current.steps).toEqual([
        'Authenticating Identity',
        'Encrypting Vote Vector',
        'Generating Secrecy Proof',
        'Submitting to Blockchain'
    ])
  })

  it('should handle errors gracefully', async () => {
    castPlainVote.mockRejectedValue(new Error('Tx Failed'))
    
    const { result } = renderHook(() => useZKVote(mockPollId))
    
    await expect(result.current.submitVote(1, null)).rejects.toThrow('Tx Failed')
    
    expect(result.current.isSubmitting).toBe(false)
  })

  it('should not submit if pollId is missing', async () => {
    const { result } = renderHook(() => useZKVote(null))
    
    let res
    await act(async () => {
        res = await result.current.submitVote(1, null)
    })
    
    expect(res).toBeUndefined()
    expect(castPlainVote).not.toHaveBeenCalled()
  })
})
