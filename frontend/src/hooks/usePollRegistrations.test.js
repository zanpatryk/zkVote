import { renderHook, waitFor } from '@testing-library/react'
import { usePollRegistrations } from './usePollRegistrations'
import { getGroupMembers, getModules } from '@/lib/blockchain/engine/read'
import { useContractEvents } from '@/hooks/useContractEvents'
import { POLL_STATE } from '@/lib/constants'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getGroupMembers: jest.fn(),
  getModules: jest.fn(),
}))

jest.mock('@/hooks/useContractEvents', () => ({
  useContractEvents: jest.fn(),
}))

describe('usePollRegistrations', () => {
  const mockPollId = '1'
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    getModules.mockResolvedValue({ eligibilityModule: '0xEligibility' })
    getGroupMembers.mockResolvedValue([])
    useContractEvents.mockReturnValue({ events: [] })
  })

  it('fetches initial data on mount', async () => {
    const initialMembers = [
      { identityCommitment: '100', blockNumber: 100, transactionHash: '0xaaa' },
      { identityCommitment: '200', blockNumber: 99, transactionHash: '0xbbb' },
    ]
    getGroupMembers.mockResolvedValue(initialMembers)

    const { result } = renderHook(() => usePollRegistrations(mockPollId, POLL_STATE.CREATED))
    
    // Initial state
    expect(result.current.loading).toBe(true)
    expect(result.current.registrations).toEqual([])

    // After fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.registrations).toEqual(initialMembers)
    expect(getGroupMembers).toHaveBeenCalledWith(mockPollId)
    expect(getModules).toHaveBeenCalledWith(mockPollId)
  })

  it('merges live events', async () => {
    const initialMembers = [{ identityCommitment: '100', blockNumber: 100, transactionHash: '0xaaa' }]
    getGroupMembers.mockResolvedValue(initialMembers)
    
    let liveEvents = []
    useContractEvents.mockImplementation(() => ({ events: liveEvents }))

    const { result, rerender } = renderHook(() => usePollRegistrations(mockPollId, POLL_STATE.CREATED))

    await waitFor(() => {
      expect(result.current.registrations).toHaveLength(1)
    })

    // Simulate new event
    liveEvents = [{ identityCommitment: '300', blockNumber: 101, transactionHash: '0xccc' }]
    rerender()

    await waitFor(() => {
      expect(result.current.registrations).toHaveLength(2)
    })

    // Expect newer registration first (descending block number)
    expect(result.current.registrations[0].identityCommitment).toBe('300')
    expect(result.current.registrations[1].identityCommitment).toBe('100')
  })

  it('handles fetch errors gracefully', async () => {
    getGroupMembers.mockRejectedValue(new Error('Fetch failed'))
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => usePollRegistrations(mockPollId, POLL_STATE.CREATED))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.registrations).toEqual([])
    expect(result.current.error).toBe('Failed to load registrations')
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load registrations:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('avoids duplicates when merging', async () => {
    const initialMembers = [{ identityCommitment: '100', blockNumber: 100, transactionHash: '0xaaa' }]
    getGroupMembers.mockResolvedValue(initialMembers)
    
    // Live event is same as initial
    const duplicateEvent = { identityCommitment: '100', blockNumber: 100, transactionHash: '0xaaa' }
    useContractEvents.mockReturnValue({ events: [duplicateEvent] })

    const { result } = renderHook(() => usePollRegistrations(mockPollId, POLL_STATE.CREATED))

    await waitFor(() => {
      expect(result.current.registrations).toHaveLength(1)
    })
  })
})
