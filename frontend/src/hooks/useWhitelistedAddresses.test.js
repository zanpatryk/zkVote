import { renderHook, waitFor, act } from '@testing-library/react'
import { useWhitelistedAddresses } from './useWhitelistedAddresses'
import { getWhitelistedAddresses, getModules } from '@/lib/blockchain/engine/read'
import { useBlockNumber } from 'wagmi'
import { useMultiContractEvents } from '@/hooks/useContractEvents'
import { toast } from 'react-hot-toast'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getWhitelistedAddresses: jest.fn(),
  getModules: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useBlockNumber: jest.fn(),
}))

jest.mock('@/hooks/useContractEvents', () => ({
  useMultiContractEvents: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

describe('useWhitelistedAddresses', () => {
  const mockPollId = '1'
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    getModules.mockResolvedValue({ eligibilityModule: '0xEligibility' })
    useBlockNumber.mockReturnValue({ data: 10000n })
    useMultiContractEvents.mockReturnValue({ events: [] })
    getWhitelistedAddresses.mockResolvedValue({ data: [], error: null })
  })

  it('initializes and fetches first batch', async () => {
    const initialAddresses = ['0x1', '0x2']
    getWhitelistedAddresses.mockResolvedValue({ data: initialAddresses, error: null })

    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))
    
    // It might be loading immediately
    // await waitFor(() => expect(result.current.loading).toBe(true)) 

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(getWhitelistedAddresses).toHaveBeenCalled()
    })
    
    // Check args: (pollId, startBlock, endBlock)
    // BATCH_SIZE is 5000. Current is 10000.
    // endBlock = 10000. startBlock = 5000.
    expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 5000n, 10000n)
    
    expect(result.current.addresses.has('0x1')).toBe(true)
    expect(result.current.addresses.has('0x2')).toBe(true)
  })

  it('paginates correctly on loadMore', async () => {
    // Round 1
    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))
    
    await waitFor(() => {
        expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 5000n, 10000n)
        expect(result.current.loading).toBe(false)
    })
    
    // Round 2
    getWhitelistedAddresses.mockClear()
    getWhitelistedAddresses.mockResolvedValue({ data: ['0x3'], error: null })
    
    await act(async () => {
        await result.current.loadMore()
    })
    
    await waitFor(() => {
        expect(result.current.loading).toBe(false)
    })

    // Last internal was 5000.
    // New end = 4999.
    // New start = 0 (since 4999 - 5000 < 0)
    expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 0n, 4999n)
    expect(result.current.addresses.has('0x3')).toBe(true)
    
    // Should set hasMore to false since startBlock was 0
    expect(result.current.hasMore).toBe(false)
  })

  it('merges live events and shows toast', async () => {
    let liveEvents = []
    useMultiContractEvents.mockImplementation(() => ({ events: liveEvents }))

    const { result, rerender } = renderHook(() => useWhitelistedAddresses(mockPollId))

    await waitFor(() => {
      expect(result.current.addresses.size).toBe(0)
    })

    // Simulate new event
    liveEvents = [{ user: '0xLive', transactionHash: '0xhash' }]
    rerender()

    await waitFor(() => {
      expect(result.current.addresses.has('0xLive')).toBe(true)
    })
    expect(toast.success).toHaveBeenCalledWith('New address whitelisted!')
  })

  it('handles fetch errors gracefully', async () => {
    getWhitelistedAddresses.mockResolvedValue({ data: [], error: 'Fetch failed' })
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load history')
    })
    
    consoleSpy.mockRestore()
  })

  it('does not fetch when pollId is null', async () => {
    const { result } = renderHook(() => useWhitelistedAddresses(null))

    expect(getWhitelistedAddresses).not.toHaveBeenCalled()
    expect(getModules).not.toHaveBeenCalled()
    expect(result.current.addresses.size).toBe(0)
  })

  it('handles getModules error gracefully', async () => {
    getModules.mockRejectedValue(new Error('Module fetch failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    renderHook(() => useWhitelistedAddresses(mockPollId))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch eligibility module:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('does not add duplicate live events', async () => {
    const existingAddress = '0xExisting'
    getWhitelistedAddresses.mockResolvedValue({ data: [existingAddress], error: null })

    let liveEvents = []
    useMultiContractEvents.mockImplementation(() => ({ events: liveEvents }))

    const { result, rerender } = renderHook(() => useWhitelistedAddresses(mockPollId))

    await waitFor(() => {
      expect(result.current.addresses.has(existingAddress)).toBe(true)
    })

    // Simulate duplicate event
    liveEvents = [{ user: existingAddress, transactionHash: '0xhash' }]
    rerender()

    // Should still have only 1 address
    await waitFor(() => {
      expect(result.current.addresses.size).toBe(1)
    })
    
    // Toast should not be called since it's a duplicate
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('handles null addresses data', async () => {
    getWhitelistedAddresses.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.addresses.size).toBe(0)
  })

  it('stops loading more when block 0 is reached', async () => {
    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))
    
    await waitFor(() => expect(result.current.loading).toBe(false))
    
    // Set internal state to block 0 (genesis scanned)
    // Actually paginates correctly on loadMore already sets hasMore false if startBlock === 0n.
    // But let's trigger the early return at the top of loadMore.
    
    // We already have a test 'paginates correctly on loadMore' that reaches block 0 and sets hasMore false.
    // If we call loadMore AGAIN, it should return early.
    
    await act(async () => {
        await result.current.loadMore() // This reaches 0 and sets hasMore false
    })
    
    getWhitelistedAddresses.mockClear()
    
    await act(async () => {
        await result.current.loadMore() // This should return early
    })
    
    expect(getWhitelistedAddresses).not.toHaveBeenCalled()
  })
})
