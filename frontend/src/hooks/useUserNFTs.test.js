import { renderHook, waitFor } from '@testing-library/react'
import { useUserNFTs } from './useUserNFTs'
import { getUserNFTs } from '@/lib/blockchain/engine/read'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getUserNFTs: jest.fn(),
}))

// Wrapper with QueryClientProvider
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

describe('useUserNFTs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty array when not connected', () => {
    getUserNFTs.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(
      () => useUserNFTs('0x123', false),
      { wrapper: createWrapper() }
    )

    expect(result.current.nfts).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(getUserNFTs).not.toHaveBeenCalled()
  })

  it('returns empty array when no address', () => {
    getUserNFTs.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(
      () => useUserNFTs(null, true),
      { wrapper: createWrapper() }
    )

    expect(result.current.nfts).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(getUserNFTs).not.toHaveBeenCalled()
  })

  it('fetches NFTs when connected with address', async () => {
    const mockNFTs = [
      { tokenId: '1', name: 'Poll #1 Results' },
      { tokenId: '2', name: 'Poll #2 Results' },
    ]
    getUserNFTs.mockResolvedValue({ data: mockNFTs, error: null })

    const { result } = renderHook(
      () => useUserNFTs('0x123', true),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.nfts).toEqual(mockNFTs)
    expect(result.current.error).toBeNull()
    expect(getUserNFTs).toHaveBeenCalledWith('0x123')
  })

  it('handles errors gracefully', async () => {
    getUserNFTs.mockResolvedValue({ data: [], error: 'Network error' })

    const { result } = renderHook(
      () => useUserNFTs('0x123', true),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.nfts).toEqual([])
    expect(result.current.error).toBe('Network error')
  })

  it('provides a refetch function', async () => {
    getUserNFTs.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(
      () => useUserNFTs('0x123', true),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})
