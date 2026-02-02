import { renderHook, act, waitFor } from '@testing-library/react'
import { useZKVote } from './useZKVote'
import { useSemaphore } from './useSemaphore'
import { usePollRegistry } from './usePollRegistry'
import { useAccount } from 'wagmi'
import { elgamal, proof as proofUtils } from '@zkvote/lib'
import { castEncryptedVote, castPlainVote, castEncryptedVoteWithProof } from '@/lib/blockchain/engine/write'
import { getPollPublicKey } from '@/lib/blockchain/engine/read'

// --- COMPLETE MOCK DEFINITIONS ---

jest.mock('./useSemaphore', () => ({
  useSemaphore: jest.fn()
}))

jest.mock('./usePollRegistry', () => ({
  usePollRegistry: jest.fn()
}))

jest.mock('wagmi', () => ({
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
    generateProof: jest.fn(),
  }
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollPublicKey: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  castEncryptedVote: jest.fn(),
  castPlainVote: jest.fn(),
  castEncryptedVoteWithProof: jest.fn(),
}))

// --- TESTS ---

jest.mock('@/lib/accountAbstraction/userOp', () => ({
  buildSponsoredVoteUserOp: jest.fn(),
  sendSponsoredPlainVote: jest.fn(),
}))

// --- TESTS ---

describe('useZKVote', () => {
  const mockPollId = '123'
  const mockIdentity = { commitment: '123' }
  const mockCastSemaphoreVote = jest.fn()
  const mockGenerateVoteProof = jest.fn()
  // Mock AA functions
  const { buildSponsoredVoteUserOp, sendSponsoredPlainVote } = require('@/lib/accountAbstraction/userOp')

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default Hooks
    useAccount.mockReturnValue({ address: '0xUser' })
    useSemaphore.mockReturnValue({
      castVote: mockCastSemaphoreVote,
      generateVoteProof: mockGenerateVoteProof,
    })
    usePollRegistry.mockReturnValue({
      isZK: false,
      isRegistered: false,
      voteStorageAddress: '0xVote',
    })

    // Default Engine
    getPollPublicKey.mockResolvedValue({ data: null }) 
    castPlainVote.mockResolvedValue({ txHash: '0xPlain' })
    castEncryptedVote.mockResolvedValue({ txHash: '0xSecret' })
    castEncryptedVoteWithProof.mockResolvedValue({ txHash: '0xUnified' })
    mockGenerateVoteProof.mockResolvedValue({ proof: [1], nullifier: '0xN' })

    // AA - Default Mocks
    buildSponsoredVoteUserOp.mockResolvedValue({ userOp: {}, entryPoint: '0xEP' })
    sendSponsoredPlainVote.mockResolvedValue({ txHash: '0xAA', voteId: 1 })

    // Default Crypto
    elgamal.init.mockResolvedValue(true)
    elgamal.randomScalar.mockReturnValue(123n)
    elgamal.encrypt.mockReturnValue({ c1: [1n, 2n], c2: [3n, 4n] })
    proofUtils.generateProof.mockResolvedValue({ proof: {}, publicSignals: new Array(66).fill('1') })
    proofUtils.formatProofForSolidity.mockReturnValue([1, 2, 3])
  })

  it('runs sponsored plain vote flow when not ZK', async () => {
    const { result } = renderHook(() => useZKVote(mockPollId))
    
    await act(async () => {
      await result.current.submitVote(1, null)
    })
    
    expect(buildSponsoredVoteUserOp).toHaveBeenCalledWith(expect.objectContaining({
        pollId: mockPollId,
        optionIdx: 1,
        voterAddress: '0xUser'
    }))
    expect(sendSponsoredPlainVote).toHaveBeenCalled()
  })

  it('fetches public keys if registry says isZK', async () => {
    usePollRegistry.mockReturnValue({ isZK: true, voteStorageAddress: '0xZK' })
    getPollPublicKey.mockResolvedValue({ data: [1n, 2n] })
    
    renderHook(() => useZKVote(mockPollId))
    
    await waitFor(() => expect(getPollPublicKey).toHaveBeenCalledWith(mockPollId))
  })

  it('runs secret vote flow if key exists', async () => {
    // Secret but NOT anonymous (Whitelisted Encrypted)
    usePollRegistry.mockReturnValue({ isZK: false, voteStorageAddress: '0xZK' })
    getPollPublicKey.mockResolvedValue({ data: [1n, 2n] })
    
    const { result } = renderHook(() => useZKVote(mockPollId))
    
    // Wait for state update strictly
    await waitFor(() => expect(result.current.pollPk).toEqual([1n, 2n]))

    await act(async () => {
       // Trigger vote
       result.current.submitVote(0, null)
    })
    
    await waitFor(() => {
        expect(elgamal.encrypt).toHaveBeenCalled()
        expect(proofUtils.generateProof).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                wasmFilePath: expect.stringContaining('.wasm'),
                zkeyFilePath: expect.stringContaining('.zkey')
            })
        )
        expect(castEncryptedVote).toHaveBeenCalled()
    })
  })

  it('runs unified flow if key exists AND isZK (anonymous)', async () => {
    usePollRegistry.mockReturnValue({ isZK: true, voteStorageAddress: '0xZK' })
    getPollPublicKey.mockResolvedValue({ data: [1n, 2n] })
    
    const { result } = renderHook(() => useZKVote(mockPollId))
    
    await waitFor(() => expect(result.current.pollPk).toEqual([1n, 2n]))

    await act(async () => {
       await result.current.submitVote(0, mockIdentity)
    })
    
    expect(mockGenerateVoteProof).toHaveBeenCalled() // Semaphore Binding
    expect(castEncryptedVoteWithProof).toHaveBeenCalled()
  })

  it('runs anonymous-only flow if isZK but NO key', async () => {
    usePollRegistry.mockReturnValue({ isZK: true, voteStorageAddress: '0xZK' })
    getPollPublicKey.mockResolvedValue({ data: null }) // No key found
    
    const { result } = renderHook(() => useZKVote(mockPollId))
    
    await waitFor(() => expect(getPollPublicKey).toHaveBeenCalled())
    
    mockCastSemaphoreVote.mockResolvedValue({ txHash: '0xSem' })

    await act(async () => {
       await result.current.submitVote(0, mockIdentity)
    })
    
    expect(mockCastSemaphoreVote).toHaveBeenCalled()
  })

  it('handles AA31 paymaster error without re-throwing', async () => {
    const error = new Error('FailedOp(0, AA31 paymaster deposit too low)')
    sendSponsoredPlainVote.mockRejectedValue(error)

    const { result } = renderHook(() => useZKVote(mockPollId))

    let submissionResult
    await act(async () => {
      // It should NOT throw
      submissionResult = await result.current.submitVote(1, null)
    })

    expect(sendSponsoredPlainVote).toHaveBeenCalled()
    expect(submissionResult).toBeNull()
  })
})
