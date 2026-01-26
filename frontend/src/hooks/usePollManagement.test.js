import { renderHook, act } from '@testing-library/react'
import { usePollManagement } from './usePollManagement'
import { startPoll, endPoll } from '@/lib/blockchain/engine/write'
import { toast } from 'react-hot-toast'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'

// Mocks
jest.mock('@/lib/blockchain/engine/write', () => ({
  startPoll: jest.fn(),
  endPoll: jest.fn(),
}))

jest.mock('react-hot-toast', () => {
  const mockToast = {
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
    error: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
  }
})

jest.mock('@/lib/blockchain/utils/error-handler', () => ({
  formatTransactionError: jest.fn((err, fallback) => fallback),
}))

describe('usePollManagement', () => {
  const mockPollId = '123'
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleStartPoll', () => {
    it('successfully starts a poll', async () => {
      startPoll.mockResolvedValueOnce()
      const { result } = renderHook(() => usePollManagement())

      await act(async () => {
        await result.current.startPoll(mockPollId, mockOnSuccess)
      })

      expect(toast.loading).toHaveBeenCalledWith('Starting poll...')
      expect(startPoll).toHaveBeenCalledWith(mockPollId)
      expect(toast.success).toHaveBeenCalledWith('Poll started successfully!', { id: 'toast-id' })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(result.current.isStarting).toBe(false)
    })

    it('handles startPoll error', async () => {
      const mockError = new Error('Revert')
      startPoll.mockRejectedValueOnce(mockError)
      const { result } = renderHook(() => usePollManagement())

      await act(async () => {
        await result.current.startPoll(mockPollId, mockOnSuccess)
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to start poll', { id: 'toast-id' })
      expect(formatTransactionError).toHaveBeenCalledWith(mockError, 'Failed to start poll')
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(result.current.isStarting).toBe(false)
    })
  })

  describe('handleEndPoll', () => {
    it('successfully ends a poll', async () => {
      endPoll.mockResolvedValueOnce()
      const { result } = renderHook(() => usePollManagement())

      await act(async () => {
        await result.current.endPoll(mockPollId, mockOnSuccess)
      })

      expect(toast.loading).toHaveBeenCalledWith('Ending poll...')
      expect(endPoll).toHaveBeenCalledWith(mockPollId)
      expect(toast.success).toHaveBeenCalledWith('Poll ended successfully!', { id: 'toast-id' })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(result.current.isEnding).toBe(false)
    })

    it('handles endPoll error', async () => {
      const mockError = new Error('Revert')
      endPoll.mockRejectedValueOnce(mockError)
      const { result } = renderHook(() => usePollManagement())

      await act(async () => {
        await result.current.endPoll(mockPollId, mockOnSuccess)
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to end poll', { id: 'toast-id' })
      expect(formatTransactionError).toHaveBeenCalledWith(mockError, 'Failed to end poll')
      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(result.current.isEnding).toBe(false)
    })
  })
})
