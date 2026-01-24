import { renderHook, waitFor, act } from '@testing-library/react'
import { usePublishTally } from './usePublishTally'
import { useReadContract } from 'wagmi'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { publishEncryptedResults } from '@/lib/blockchain/engine/write'
import { decryptTally, generateTallyProof } from '@/lib/crypto/tally'
import { toast } from 'react-hot-toast'
import { toastTransactionError } from '@/lib/blockchain/utils/error-handler'

// Mock dependencies
jest.mock('wagmi', () => ({
  useReadContract: jest.fn(),
}))

jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  publishEncryptedResults: jest.fn(),
}))

jest.mock('@/lib/blockchain/utils/error-handler', () => ({
  toastTransactionError: jest.fn(),
}))

jest.mock('@/lib/crypto/tally', () => ({
  decryptTally: jest.fn(),
  generateTallyProof: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
}))

describe('usePublishTally', () => {
  const mockPollId = '1'
  const mockRefetch = jest.fn()
  const mockRefetchPollState = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    useReadContract.mockReturnValue({
      data: [Array(16).fill(['0', '0']), Array(16).fill(['0', '0'])], // [ciphertexts, sum]
      refetch: mockRefetch,
    })
    
    usePollRegistry.mockReturnValue({ refetchPollState: mockRefetchPollState })
    
    // Correct structure for decryptTally
    decryptTally.mockResolvedValue({ 
      tally: [1, 2, 3], 
      publicKey: '0xPK', 
      ciphertexts: [[0n, 0n]] 
    })
    
    generateTallyProof.mockResolvedValue('0xProof')
    publishEncryptedResults.mockResolvedValue('0xTxHash')
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePublishTally(mockPollId))
    
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.decryptedTally).toBe(null)
    expect(result.current.ciphertexts).toBeDefined()
  })

  it('publishes tally successfully', async () => {
    const { result } = renderHook(() => usePublishTally(mockPollId))
    const mockSk = '0xSecret'

    await act(async () => {
      await result.current.publishTally(mockSk)
    })

    expect(decryptTally).toHaveBeenCalled()
    expect(generateTallyProof).toHaveBeenCalled()
    expect(publishEncryptedResults).toHaveBeenCalledWith(mockPollId, [1, 2, 3], '0xProof')
    expect(toast.success).toHaveBeenCalledWith('Results published!', expect.any(Object))
    expect(mockRefetchPollState).toHaveBeenCalled()
  })

  it('handles missing ciphertexts', async () => {
    useReadContract.mockReturnValue({ data: undefined, refetch: mockRefetch })
    const { result } = renderHook(() => usePublishTally(mockPollId))
    const mockSk = '0xSecret'

    await expect(async () => {
        await act(async () => {
            await result.current.publishTally(mockSk)
        })
    }).rejects.toThrow('Ciphertexts not loaded')

    expect(publishEncryptedResults).not.toHaveBeenCalled()
  })



  it('handles decryption/proof generation errors', async () => {
    decryptTally.mockRejectedValue(new Error('Decryption failed'))
    const { result } = renderHook(() => usePublishTally(mockPollId))
    const mockSk = '0xSecret'

    await expect(async () => {
        await act(async () => {
            await result.current.publishTally(mockSk)
        })
    }).rejects.toThrow('Decryption failed')

    expect(toastTransactionError).toHaveBeenCalledWith(expect.any(Error), 'Decryption or publishing failed', expect.any(Object))
    expect(result.current.isProcessing).toBe(false)
  })

  it('handles transaction errors', async () => {
    publishEncryptedResults.mockRejectedValue(new Error('Tx failed'))
    const { result } = renderHook(() => usePublishTally(mockPollId))
    const mockSk = '0xSecret'

    await expect(async () => {
        await act(async () => {
            await result.current.publishTally(mockSk)
        })
    }).rejects.toThrow('Tx failed')

    expect(toastTransactionError).toHaveBeenCalledWith(expect.any(Error), 'Decryption or publishing failed', expect.any(Object))
    expect(result.current.isProcessing).toBe(false)
  })

  it('throws error when secret key is missing', async () => {
    const { result } = renderHook(() => usePublishTally(mockPollId))

    await expect(async () => {
        await act(async () => {
            await result.current.publishTally(null)
        })
    }).rejects.toThrow('Please enter the Secret Key')

    expect(publishEncryptedResults).not.toHaveBeenCalled()
  })

  it('updates decryptedTally state after successful decryption', async () => {
    const { result } = renderHook(() => usePublishTally(mockPollId))
    const mockSk = '0xSecret'

    await act(async () => {
      await result.current.publishTally(mockSk)
    })

    expect(result.current.decryptedTally).toEqual([1, 2, 3])
  })
})
