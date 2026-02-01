import { renderHook, waitFor } from '@testing-library/react'
import { useWhitelistedPolls, useOwnedPolls, usePoll } from './usePolls'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as read from '@/lib/blockchain/engine/read'

// Mock blockchain read functions
jest.mock('@/lib/blockchain/engine/read', () => ({
  getWhitelistedPolls: jest.fn(),
  getOwnedPolls: jest.fn(),
  getPollById: jest.fn(),
  isUserWhitelisted: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useChainId: jest.fn(() => 31337),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePolls Hooks', () => {
  const mockAddress = '0x123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useWhitelistedPolls', () => {
    it('fetches whitelisted polls', async () => {
      const mockData = [{ pollId: '1', title: 'Poll 1' }]
      read.getWhitelistedPolls.mockResolvedValue({ data: mockData, error: null })

      const { result } = renderHook(() => useWhitelistedPolls(mockAddress, true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.polls).toEqual(mockData)
      expect(read.getWhitelistedPolls).toHaveBeenCalledWith(mockAddress)
    })

    it('does not fetch if not connected', async () => {
       const { result } = renderHook(() => useWhitelistedPolls(mockAddress, false), {
        wrapper: createWrapper(),
      })
      
      expect(read.getWhitelistedPolls).not.toHaveBeenCalled()
    })

    it('handles errors from read function', async () => {
      read.getWhitelistedPolls.mockResolvedValue({ data: [], error: 'Read failed' })

      const { result } = renderHook(() => useWhitelistedPolls(mockAddress, true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Read failed')
      expect(result.current.polls).toEqual([])
    })
  })

  describe('useOwnedPolls', () => {
    it('fetches owned polls and checks whitelist status', async () => {
      const mockOwnedPolls = [
          { pollId: '1', title: 'Poll 1' },
          { pollId: '2', title: 'Poll 2' }
      ]
      read.getOwnedPolls.mockResolvedValue({ data: mockOwnedPolls, error: null })
      read.isUserWhitelisted.mockImplementation((id) => Promise.resolve({ data: id === '1', error: null })) // Poll 1 whitelisted, Poll 2 not

      const { result } = renderHook(() => useOwnedPolls(mockAddress, true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.polls).toHaveLength(2)
      expect(result.current.polls[0].isWhitelisted).toBe(true)
      expect(result.current.polls[1].isWhitelisted).toBe(false)
      
      expect(read.getOwnedPolls).toHaveBeenCalledWith(mockAddress)
      expect(read.isUserWhitelisted).toHaveBeenCalledTimes(2)
    })

    it('handles throw errors in fetch function', async () => {
      read.getOwnedPolls.mockRejectedValue(new Error('Hard crash'))

      const { result } = renderHook(() => useOwnedPolls(mockAddress, true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBeDefined()
    })

    it('handles null data response', async () => {
      read.getOwnedPolls.mockResolvedValue({ data: null, error: null })

      const { result } = renderHook(() => useOwnedPolls(mockAddress, true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.polls).toEqual([])
    })

    it('handles query function error response', async () => {
       read.getOwnedPolls.mockResolvedValue({ data: [], error: 'Custom Error' })

      const { result } = renderHook(() => useOwnedPolls(mockAddress, true), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Custom Error')
    })
  })

  describe('usePoll', () => {
    const mockPollId = '1'

    it('fetches poll by ID', async () => {
      const mockPoll = { pollId: '1', title: 'Poll 1' }
      read.getPollById.mockResolvedValue({ data: mockPoll, error: null })

      const { result } = renderHook(() => usePoll(mockPollId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      
      expect(result.current.poll).toEqual(mockPoll)
      expect(read.getPollById).toHaveBeenCalledWith(mockPollId)
    })

    it('handles errors', async () => {
      read.getPollById.mockResolvedValue({ data: null, error: 'Not found' })

      const { result } = renderHook(() => usePoll(mockPollId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      
      expect(result.current.error).toBe('Not found')
      expect(result.current.poll).toBeNull()
    })

    it('does not fetch if pollId is missing', async () => {
      const { result } = renderHook(() => usePoll(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(read.getPollById).not.toHaveBeenCalled()
    })
  })
})
