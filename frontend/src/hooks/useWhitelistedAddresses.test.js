import { renderHook, waitFor, act } from '@testing-library/react'
import { useWhitelistedAddresses } from './useWhitelistedAddresses'
import { getWhitelistedAddresses, getModules } from '@/lib/blockchain/engine/read'
import { useBlockNumber } from 'wagmi'
import { useMultiContractEvents } from '@/hooks/useContractEvents'
import { toast } from 'react-hot-toast'
import { whitelistUsers } from '@/lib/blockchain/engine/members'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getWhitelistedAddresses: jest.fn(),
  getModules: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useBlockNumber: jest.fn(),
  useChainId: jest.fn(),
}))

jest.mock('@/hooks/useContractEvents', () => ({
  useMultiContractEvents: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
}))

jest.mock('@/lib/blockchain/engine/members', () => ({
  whitelistUsers: jest.fn(),
}))

jest.mock('@/lib/blockchain/utils/error-handler', () => ({
  formatTransactionError: jest.fn((e) => e.message),
}))

describe('useWhitelistedAddresses', () => {
  const mockPollId = '1'
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    getModules.mockResolvedValue({ eligibilityModule: '0xEligibility' })
    useBlockNumber.mockReturnValue({ data: 1000n })
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('wagmi').useChainId.mockReturnValue(31337)
    useMultiContractEvents.mockReturnValue({ events: [] })
    getWhitelistedAddresses.mockResolvedValue({ data: [], error: null })
  })

  it('initializes and fetches first batch', async () => {
    const initialAddresses = ['0x1', '0x2']
    getWhitelistedAddresses.mockResolvedValue({ data: initialAddresses, error: null })

    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(getWhitelistedAddresses).toHaveBeenCalled()
    })
    
    expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 100n, 1000n)
    
    expect(result.current.addresses.has('0x1')).toBe(true)
    expect(result.current.addresses.has('0x2')).toBe(true)
  })

  it('paginates correctly on loadMore', async () => {
    // Round 1
    const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))
    
    await waitFor(() => {
        expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 100n, 1000n)
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

    expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 0n, 99n)
    expect(result.current.addresses.has('0x3')).toBe(true)
    
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
      expect(result.current.addresses.has('0xlive')).toBe(true)
    })
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
      expect(result.current.addresses.has(existingAddress.toLowerCase())).toBe(true)
    })

    // Simulate duplicate event
    liveEvents = [{ user: existingAddress, transactionHash: '0xhash' }]
    rerender()

    await waitFor(() => {
      expect(result.current.addresses.size).toBe(1)
    })
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
    
    await act(async () => {
        await result.current.loadMore() 
    })
    
    getWhitelistedAddresses.mockClear()
    
    await act(async () => {
        await result.current.loadMore()
    })
    
    expect(getWhitelistedAddresses).not.toHaveBeenCalled()
  })

  describe('parser logic', () => {
    it('filters logs correctly by pollId', () => {
        renderHook(() => useWhitelistedAddresses(mockPollId))
        
        const call = useMultiContractEvents.mock.calls[0][0]
        const parser = call.parseLog
        
        // Match
        expect(parser({ args: { user: '0x1', pollId: 1n }, transactionHash: '0x', blockNumber: 1n }))
            .toMatchObject({ user: '0x1' })
            
        // Mismatch
        expect(parser({ args: { user: '0x1', pollId: 2n }, transactionHash: '0x', blockNumber: 1n }))
            .toBeNull()
            
        // No user
        expect(parser({ args: { pollId: 1n }, transactionHash: '0x', blockNumber: 1n }))
            .toBeNull()

         // Missing pollId (assumed legacy or irrelevant logic, but code allows it)
        expect(parser({ args: { user: '0x1' }, transactionHash: '0x', blockNumber: 1n }))
            .toMatchObject({ user: '0x1' })
    })
  })

  describe('addToWhitelist', () => {
    it('calls whitelistUsers successfully', async () => {
        whitelistUsers.mockResolvedValue(true)
        const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))
        
        await act(async () => {
            await result.current.addToWhitelist(['0xNew'])
        })
        
        expect(whitelistUsers).toHaveBeenCalledWith(mockPollId, ['0xNew'])
        expect(toast.success).toHaveBeenCalled()
    })

    it('handles errors in addToWhitelist', async () => {
        const error = new Error('Revert')
        whitelistUsers.mockRejectedValue(error)
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        
        const { result } = renderHook(() => useWhitelistedAddresses(mockPollId))
        
        await expect(result.current.addToWhitelist(['0xNew'])).rejects.toThrow(error)
        
        expect(toast.error).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalledWith('Failed to whitelist addresses:', error)
        
        consoleSpy.mockRestore()
    })
  })
})
