import { renderHook, waitFor } from '@testing-library/react'
import { useWhitelistedPolls, useOwnedPolls } from './usePolls'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as read from '@/lib/blockchain/engine/read'

// Mock blockchain read functions
jest.mock('@/lib/blockchain/engine/read', () => ({
  getWhitelistedPolls: jest.fn(),
  getOwnedPolls: jest.fn(),
  isUserWhitelisted: jest.fn(),
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
      const mockData = [{ pollId: 1n, title: 'Poll 1' }]
      read.getWhitelistedPolls.mockResolvedValue(mockData)

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
      
      
      // When enabled is false, useQuery behavior depends on version for isLoading.
      // We primarily want to verify the API was not called.
      expect(read.getWhitelistedPolls).not.toHaveBeenCalled()
    })
  })

  describe('useOwnedPolls', () => {
    it('fetches owned polls and checks whitelist status', async () => {
      const mockOwnedPolls = [
          { pollId: 1n, title: 'Poll 1' },
          { pollId: 2n, title: 'Poll 2' }
      ]
      read.getOwnedPolls.mockResolvedValue(mockOwnedPolls)
      read.isUserWhitelisted.mockImplementation((id) => Promise.resolve(id === 1n)) // Poll 1 whitelisted, Poll 2 not

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
  })
})
