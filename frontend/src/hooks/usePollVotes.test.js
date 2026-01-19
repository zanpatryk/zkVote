import { renderHook, waitFor } from '@testing-library/react'
import { usePollVotes } from './usePollVotes'
import { getPollVotes, getModules } from '@/lib/blockchain/engine/read'
import { useContractEvents } from '@/hooks/useContractEvents'
import { POLL_STATE } from '@/lib/constants'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollVotes: jest.fn(),
  getModules: jest.fn(),
}))

jest.mock('@/hooks/useContractEvents', () => ({
  useContractEvents: jest.fn(),
}))

describe('usePollVotes', () => {
  const mockPollId = '1'
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    getModules.mockResolvedValue({ voteStorage: '0xVoteStorage' })
    getPollVotes.mockResolvedValue([])
    useContractEvents.mockReturnValue({ events: [] })
  })

  it('fetches initial data on mount', async () => {
    const initialVotes = [
      { voteId: '1', voter: '0x1', blockNumber: 100, transactionHash: '0xaaa' },
      { voteId: '2', voter: '0x2', blockNumber: 99, transactionHash: '0xbbb' },
    ]
    getPollVotes.mockResolvedValue(initialVotes)

    const { result } = renderHook(() => usePollVotes(mockPollId, POLL_STATE.ACTIVE))
    
    // Initial state
    expect(result.current.loading).toBe(true)
    expect(result.current.votes).toEqual([])

    // After fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.votes).toEqual(initialVotes)
    expect(getPollVotes).toHaveBeenCalledWith(mockPollId)
    expect(getModules).toHaveBeenCalledWith(mockPollId)
  })

  it('merges live events', async () => {
    const initialVotes = [{ voteId: '1', voter: '0x1', blockNumber: 100, transactionHash: '0xaaa' }]
    getPollVotes.mockResolvedValue(initialVotes)
    
    // Mock live event hook to return new event later?
    // renderHook supports rerender.
    
    let liveEvents = []
    useContractEvents.mockImplementation(() => ({ events: liveEvents }))

    const { result, rerender } = renderHook(() => usePollVotes(mockPollId, POLL_STATE.ACTIVE))

    await waitFor(() => {
      expect(result.current.votes).toHaveLength(1)
    })

    // Simulate new event
    liveEvents = [{ voteId: '2', voter: '0x2', blockNumber: 101, transactionHash: '0xccc' }]
    rerender()

    await waitFor(() => {
      expect(result.current.votes).toHaveLength(2)
    })

    // Expect newer vote first (descending block number)
    expect(result.current.votes[0].voteId).toBe('2')
    expect(result.current.votes[1].voteId).toBe('1')
  })

  it('handles fetch errors gracefully', async () => {
    getPollVotes.mockRejectedValue(new Error('Fetch failed'))
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => usePollVotes(mockPollId, POLL_STATE.ACTIVE))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.votes).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch votes:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('avoids duplicates when merging', async () => {
    const initialVotes = [{ voteId: '1', voter: '0x1', blockNumber: 100, transactionHash: '0xaaa' }]
    getPollVotes.mockResolvedValue(initialVotes)
    
    // Live event is same as initial
    const duplicateEvent = { voteId: '1', voter: '0x1', blockNumber: 100, transactionHash: '0xaaa' }
    useContractEvents.mockReturnValue({ events: [duplicateEvent] })

    const { result } = renderHook(() => usePollVotes(mockPollId, POLL_STATE.ACTIVE))

    await waitFor(() => {
      expect(result.current.votes).toHaveLength(1)
    })
  })
})
