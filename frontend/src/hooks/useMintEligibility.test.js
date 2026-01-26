import { renderHook, waitFor } from '@testing-library/react'
import { useMintEligibility } from './useMintEligibility'
import { getPollById, isUserWhitelisted, getZKPollState } from '@/lib/blockchain/engine/read'
import { useUserNFTs } from './useUserNFTs'
import { useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  isUserWhitelisted: jest.fn(),
  getZKPollState: jest.fn(),
}))

jest.mock('./useUserNFTs', () => ({
  useUserNFTs: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
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

describe('useMintEligibility', () => {
  const mockPollId = '1'
  const mockUserAddress = '0xUser'

  beforeEach(() => {
    jest.clearAllMocks()
    useAccount.mockReturnValue({ address: mockUserAddress, isConnected: true })
    useUserNFTs.mockReturnValue({ nfts: [], isLoading: false, isFetching: false, refetch: jest.fn() })
  })

  it('computes eligible state for creator when poll ended', async () => {
    getPollById.mockResolvedValue({ data: { pollId: '1', state: 2, creator: mockUserAddress.toLowerCase() }, error: null })
    getZKPollState.mockResolvedValue({ data: { resultsPublished: true }, error: null })

    const { result } = renderHook(() => useMintEligibility(mockPollId), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canMint).toBe(true)
    expect(result.current.isCreator).toBe(true)
    expect(result.current.hasMinted).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('computes eligible state for whitelisted user when poll ended', async () => {
    getPollById.mockResolvedValue({ data: { pollId: '1', state: 2, creator: '0xOther' }, error: null })
    getZKPollState.mockResolvedValue({ data: { resultsPublished: true }, error: null })
    isUserWhitelisted.mockResolvedValue({ data: true, error: null })

    const { result } = renderHook(() => useMintEligibility(mockPollId), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canMint).toBe(true)
    expect(result.current.isWhitelisted).toBe(true)
    expect(result.current.isCreator).toBe(false)
  })

  it('computes isWrongState when poll not ended', async () => {
    getPollById.mockResolvedValue({ data: { pollId: '1', state: 1, creator: mockUserAddress.toLowerCase() }, error: null })
    getZKPollState.mockResolvedValue({ data: { resultsPublished: false }, error: null })

    const { result } = renderHook(() => useMintEligibility(mockPollId), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canMint).toBe(false)
    expect(result.current.isWrongState).toBe(true)
  })

  it('computes isResultsPending when results not published', async () => {
    getPollById.mockResolvedValue({ data: { pollId: '1', state: 2, creator: mockUserAddress.toLowerCase() }, error: null })
    getZKPollState.mockResolvedValue({ data: { resultsPublished: false }, error: null })

    const { result } = renderHook(() => useMintEligibility(mockPollId), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.canMint).toBe(false)
    expect(result.current.isResultsPending).toBe(true)
  })

  it('detects already minted NFT', async () => {
    getPollById.mockResolvedValue({ data: { pollId: '1', state: 2, creator: mockUserAddress.toLowerCase() }, error: null })
    getZKPollState.mockResolvedValue({ data: { resultsPublished: true }, error: null })
    useUserNFTs.mockReturnValue({ 
      nfts: [{ name: 'Poll #1 Results', pollId: '1' }], 
      isLoading: false, 
      isFetching: false,
      refetch: jest.fn() 
    })

    const { result } = renderHook(() => useMintEligibility(mockPollId), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.hasMinted).toBe(true)
  })

  it('handles fetch errors gracefully', async () => {
    getPollById.mockResolvedValue({ data: null, error: 'Database error' })

    const { result } = renderHook(() => useMintEligibility(mockPollId), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Database error')
  })
})
