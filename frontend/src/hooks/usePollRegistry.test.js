import { renderHook } from '@testing-library/react'
import { usePollRegistry } from './usePollRegistry'
import { useAccount } from 'wagmi'
import { getModules, getMerkleTreeDepth, isUserRegistered, getZKPollState } from '@/lib/blockchain/engine/read'
import { useQuery } from '@tanstack/react-query'

// MOCKS
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0xUser' })),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getModules: jest.fn(),
  getMerkleTreeDepth: jest.fn(),
  isUserRegistered: jest.fn(),
  getZKPollState: jest.fn(),
}))

describe('usePollRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAccount.mockReturnValue({ address: '0xUser' })
    
    // Default Engine Mocks
    getModules.mockResolvedValue({ eligibilityModule: '0xEli', voteStorage: '0xVote' })
    getMerkleTreeDepth.mockResolvedValue({ data: 0 })
    isUserRegistered.mockResolvedValue({ data: false })
    getZKPollState.mockResolvedValue({ data: { resultsPublished: false } })

    useQuery.mockImplementation(({ queryKey }) => {
        const key = queryKey[0]
        if (key === 'pollModules') return { data: { eligibilityModule: '0xEli', voteStorage: '0xVote' }, isLoading: false }
        if (key === 'merkleDepth') return { data: { data: 0 } }
        if (key === 'isRegistered') return { data: { data: false }, refetch: jest.fn() }
        if (key === 'zkPollState') return { data: { data: { resultsPublished: false } }, refetch: jest.fn() }
        return { data: undefined }
    })
  })

  it('detects ZK poll correctly', () => {
    // Override for this test
    useQuery.mockImplementation(({ queryKey }) => {
        const key = queryKey[0]
        if (key === 'pollModules') return { data: { eligibilityModule: '0xEli', voteStorage: '0xVote' }, isLoading: false }
        if (key === 'merkleDepth') return { data: { data: 20 } } // ZK
        if (key === 'isRegistered') return { data: { data: false } }
        if (key === 'zkPollState') return { data: { data: { resultsPublished: false } } }
        return {}
    })

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isZK).toBe(true)
    expect(result.current.merkleTreeDepth).toBe(20)
    expect(result.current.eligibilityModuleAddress).toBe('0xEli')
  })

  it('detects non-ZK poll', () => {
      // Default mock has depth 0
      const { result } = renderHook(() => usePollRegistry('123'))
      expect(result.current.isZK).toBe(false)
      expect(result.current.merkleTreeDepth).toBe(0)
  })

  it('detects registered status', () => {
    useQuery.mockImplementation(({ queryKey }) => {
        const key = queryKey[0]
        if (key === 'pollModules') return { data: { eligibilityModule: '0xEli', voteStorage: '0xVote' } }
        if (key === 'merkleDepth') return { data: { data: 20 } }
        if (key === 'isRegistered') return { data: { data: true } } // Registered
        if (key === 'zkPollState') return { data: { data: { resultsPublished: false } } }
        return {}
    })
    
    const { result } = renderHook(() => usePollRegistry('123'))
    expect(result.current.isRegistered).toBe(true)
  })

  it('detects results published', () => {
    useQuery.mockImplementation(({ queryKey }) => {
        const key = queryKey[0]
        if (key === 'pollModules') return { data: { eligibilityModule: '0xEli', voteStorage: '0xVote' } }
        if (key === 'merkleDepth') return { data: { data: 20 } }
        if (key === 'isRegistered') return { data: { data: false } }
        if (key === 'zkPollState') return { data: { data: { resultsPublished: true } } } // Published
        return {}
    })

    const { result } = renderHook(() => usePollRegistry('123'))
    expect(result.current.resultsPublished).toBe(true)
  })

  it('passes module addresses correctly', () => {
     useQuery.mockImplementation(({ queryKey }) => {
        const key = queryKey[0]
        if (key === 'pollModules') return { data: { eligibilityModule: '0xPollEli', voteStorage: '0xPollVote' } }
        return { data: { data: 0 } }
    })
    const { result } = renderHook(() => usePollRegistry('123'))
    expect(result.current.eligibilityModuleAddress).toBe('0xPollEli')
    expect(result.current.voteStorageAddress).toBe('0xPollVote')
  })

  it('exposes refetch functions', () => {
    const mockRefetch = jest.fn()
    useQuery.mockReturnValue({ data: {}, refetch: mockRefetch })
    
    const { result } = renderHook(() => usePollRegistry('123'))
    
    expect(result.current.refetchRegistration).toBeDefined()
    expect(result.current.refetchPollState).toBeDefined()
    result.current.refetchRegistration()
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('invokes engine functions via queryFn', () => {
    // We capture the calls to useQuery
    renderHook(() => usePollRegistry('123'))
    
    // Check call arguments
    const calls = useQuery.mock.calls
    
    // 1. Modules
    const modulesCall = calls.find(c => c[0].queryKey[0] === 'pollModules')
    if (modulesCall) {
        modulesCall[0].queryFn() // Invoke it
        expect(getModules).toHaveBeenCalledWith('123')
    }

    // 2. Depth
    const depthCall = calls.find(c => c[0].queryKey[0] === 'merkleDepth')
    if (depthCall) {
        depthCall[0].queryFn()
        expect(getMerkleTreeDepth).toHaveBeenCalledWith('123')
    }

    // 3. Registered
    const regCall = calls.find(c => c[0].queryKey[0] === 'isRegistered')
    if (regCall) {
        regCall[0].queryFn()
        expect(isUserRegistered).toHaveBeenCalledWith('123', '0xUser')
    }
    
    // 4. Poll State
    // 4. Poll State
    // To verify getZKPollState is called, we must ensure isZK is true.
    // The hook relies on 'merkleDepth' > 0 to set isZK=true and enable the zkPollState query.
    // We re-render the hook with a mocked depth of 20 to trigger this flow.

    // New render with ZK enabled
    useQuery.mockImplementation(({ queryKey }) => {
        const key = queryKey[0]
        if (key === 'pollModules') return { data: { eligibilityModule: '0xEli', voteStorage: '0xVote' } }
        if (key === 'merkleDepth') return { data: { data: 20 } } // ZK!
        if (key === 'zkPollState') return { data: { data: null } }
        return { data: undefined }
    })
    
    // Clear previous calls
    useQuery.mockClear()
    renderHook(() => usePollRegistry('123'))
    
    const zkCalls = useQuery.mock.calls
    const zkStateCall = zkCalls.find(c => c[0].queryKey[0] === 'zkPollState')
    if (zkStateCall) {
        zkStateCall[0].queryFn()
        expect(getZKPollState).toHaveBeenCalledWith('123')
    }
  })
})
