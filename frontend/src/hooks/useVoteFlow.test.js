import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoteFlow } from './useVoteFlow'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useZKVote } from './useZKVote'
import { usePollRegistry } from './usePollRegistry'
import { usePoll } from './usePolls'
import { hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { useIdentityTransfer } from '@/lib/providers/IdentityTransferContext'
import { toast } from 'react-hot-toast'
import React from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('./useZKVote', () => ({
  useZKVote: jest.fn(),
}))

jest.mock('./usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('./usePolls', () => ({
  usePoll: jest.fn(),
}))

jest.mock('./useSemaphore', () => ({
  useSemaphore: () => ({ isLoadingIdentity: false }),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  hasVoted: jest.fn(),
  getVoteTransaction: jest.fn(),
}))

jest.mock('@/lib/providers/IdentityTransferContext', () => ({
  useIdentityTransfer: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}))

describe('useVoteFlow', () => {
  const mockPollId = '123'
  const mockPollData = { id: mockPollId, title: 'Test Poll', isZK: true }
  const mockRouter = { replace: jest.fn(), push: jest.fn() }
  const mockSubmitVote = jest.fn()
  const mockConsumeIdentity = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ address: '0xUser', isConnected: true })
    useZKVote.mockReturnValue({
      submitVote: mockSubmitVote,
      isSubmitting: false,
      currentStep: 0,
      steps: []
    })
    usePollRegistry.mockReturnValue({ isZK: true, isRegistered: true })
    usePoll.mockReturnValue({ poll: mockPollData, isLoading: false, error: null })
    hasVoted.mockResolvedValue({ data: false, error: null })
    useIdentityTransfer.mockReturnValue({ consumeIdentity: mockConsumeIdentity })
    mockConsumeIdentity.mockReturnValue(null)
  })

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useVoteFlow(mockPollId))

    expect(result.current.poll).toEqual(mockPollData)
    expect(result.current.alreadyVoted).toBe(false)
    expect(result.current.loadedIdentity).toBeNull()
  })

  it('checks vote status on mount', async () => {
    hasVoted.mockResolvedValue({ data: true, error: null })
    getVoteTransaction.mockResolvedValue({ data: '0xTxHash' })

    const { result } = renderHook(() => useVoteFlow(mockPollId))

    await waitFor(() => {
      expect(result.current.alreadyVoted).toBe(true)
      expect(result.current.voteTxHash).toBe('0xTxHash')
    })
  })

  it('consumes identity from context if available', async () => {
    const mockId = { commitment: '123' }
    mockConsumeIdentity.mockReturnValue(mockId)

    const { result } = renderHook(() => useVoteFlow(mockPollId))

    await waitFor(() => {
      expect(result.current.loadedIdentity).toEqual(mockId)
      expect(toast.success).toHaveBeenCalledWith('Identity loaded')
    })
  })

  it('redirects to auth if ZK and no identity loaded', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useVoteFlow(mockPollId))

    // Wait for internal async loading (checkVoteStatus) to finish before advancing timers
    await act(async () => {
        await Promise.resolve() 
    })

    await act(async () => {
      jest.advanceTimersByTime(501)
    })

    expect(mockRouter.replace).toHaveBeenCalledWith(`/poll/${mockPollId}/auth`)
    expect(toast.error).toHaveBeenCalledWith('Please authenticate to vote')
    jest.useRealTimers()
  })

  it('handles vote submission successfully', async () => {
    const mockIdentity = { commitment: '123' }
    mockConsumeIdentity.mockReturnValue(mockIdentity)
    mockSubmitVote.mockResolvedValue({ voteId: 'v1', txHash: '0xTx', nullifier: 'n1', proof: {} })

    const { result } = renderHook(() => useVoteFlow(mockPollId))

    // Wait for identity loading
    await waitFor(() => expect(result.current.loadedIdentity).toEqual(mockIdentity))

    await act(async () => {
      await result.current.handleVoteSubmit(0)
    })

    expect(mockSubmitVote).toHaveBeenCalledWith(0, mockIdentity)
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/poll/123/vote/receipt/v1'))
  })

  it('blocks submission if not connected', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    const { result } = renderHook(() => useVoteFlow(mockPollId))

    await act(async () => {
      await result.current.handleVoteSubmit(0)
    })

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    expect(mockSubmitVote).not.toHaveBeenCalled()
  })

  it('blocks submission if ZK but not registered/loaded', async () => {
    usePollRegistry.mockReturnValue({ isZK: true, isRegistered: false })
    mockConsumeIdentity.mockReturnValue(null)

    const { result } = renderHook(() => useVoteFlow(mockPollId))

    // Wait for checkVoteStatus
    await act(async () => { await Promise.resolve() })

    await act(async () => {
      await result.current.handleVoteSubmit(0)
    })

    expect(toast.error).toHaveBeenCalledWith('You are not registered for this poll')
    expect(mockSubmitVote).not.toHaveBeenCalled()
  })
})
