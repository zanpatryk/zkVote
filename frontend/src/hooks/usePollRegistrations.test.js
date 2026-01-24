import { renderHook, act, waitFor } from '@testing-library/react'
import { usePollRegistrations } from './usePollRegistrations'
import { getGroupMembers, getModules, getMemberAddedEventSignature, parseMemberAddedLog } from '@/lib/blockchain/engine/read'
import { useContractEvents } from '@/hooks/useContractEvents'

// MOCKS
jest.mock('@/lib/blockchain/engine/read', () => ({
  getGroupMembers: jest.fn(),
  getModules: jest.fn(),
  getMemberAddedEventSignature: jest.fn(() => 'MemberAddedMock'),
  parseMemberAddedLog: jest.fn(l => l.parsed),
}))

// MOCKS corrected below

// Note: Jest mock lifting might cause syntax error above if not clean
// Re-mocking properly below

jest.mock('@/hooks/useContractEvents', () => ({
  useContractEvents: jest.fn(),
}))

describe('usePollRegistrations', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getModules.mockResolvedValue({ eligibilityModule: '0xEli' })
        getGroupMembers.mockResolvedValue({ data: [] })
        useContractEvents.mockReturnValue({ events: [] })
    })

    it('loads initial data correctly', async () => {
        const mockMembers = [
            { blockNumber: 10, transactionHash: '0x1' },
            { blockNumber: 20, transactionHash: '0x2' }
        ]
        getGroupMembers.mockResolvedValue({ data: mockMembers })
        
        const { result } = renderHook(() => usePollRegistrations('123', 0)) // 0 = CREATED
        
        await waitFor(() => expect(result.current.loading).toBe(false))
        
        expect(result.current.registrations).toHaveLength(2)
        expect(result.current.registrations[0].blockNumber).toBe(20) // Sorted descending
    })

    it('subscribes to events with correct signature', async () => {
        renderHook(() => usePollRegistrations('123', 0)) // CREATED
        
        await waitFor(() => expect(getModules).toHaveBeenCalled())
        
        expect(useContractEvents).toHaveBeenCalledWith(expect.objectContaining({
            address: '0xEli',
            eventSignature: 'MemberAddedMock',
            enabled: true
        }))
    })

    it('updates registrations with live events', async () => {
        getGroupMembers.mockResolvedValue({ data: [{ transactionHash: '0xOld', blockNumber: 5 }] })
        
        // Initial render with no events
        useContractEvents.mockReturnValue({ events: [] })
        const { result, rerender } = renderHook(() => usePollRegistrations('123', 0))
        
        await waitFor(() => expect(result.current.registrations).toHaveLength(1))
        
        // Rerender with new event
        useContractEvents.mockReturnValue({ 
            events: [{ transactionHash: '0xNew', blockNumber: 15 }] 
        })
        rerender()
        
        await waitFor(() => expect(result.current.registrations).toHaveLength(2))
        expect(result.current.registrations[0].transactionHash).toBe('0xNew') // Newest first
    })
})
