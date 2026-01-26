import { renderHook, act, waitFor } from '@testing-library/react'
import { useCreatePollForm } from './useCreatePollForm'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { createPoll } from '@/lib/blockchain/engine/write'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'
import { toast } from 'react-hot-toast'
import React from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  createPoll: jest.fn(),
}))

jest.mock('@/lib/blockchain/utils/error-handler', () => ({
  formatTransactionError: jest.fn((err, fallback) => fallback),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn().mockReturnValue('loading-id'),
  },
}))

describe('useCreatePollForm', () => {
  const mockRouter = { push: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ isConnected: true })
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useCreatePollForm())

    expect(result.current.title).toBe('')
    expect(result.current.isAnonymous).toBe(true)
    expect(result.current.isSecret).toBe(false)
    expect(result.current.options).toEqual(['', ''])
  })

  it('handles successful poll creation', async () => {
    createPoll.mockResolvedValue('poll-123')
    const { result } = renderHook(() => useCreatePollForm())

    await act(async () => {
      result.current.setTitle('Test Poll')
      result.current.setOptions(['Option 1', 'Option 2'])
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(createPoll).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Poll',
      options: ['Option 1', 'Option 2']
    }))
    expect(mockRouter.push).toHaveBeenCalledWith('/poll/poll-123/whitelist')
  })

  it('validates title is required', async () => {
    const { result } = renderHook(() => useCreatePollForm())

    await act(async () => {
      result.current.setOptions(['Option 1', 'Option 2'])
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(toast.error).toHaveBeenCalledWith('Poll title is required')
    expect(createPoll).not.toHaveBeenCalled()
  })

  it('validates at least 2 options are required', async () => {
    const { result } = renderHook(() => useCreatePollForm())

    await act(async () => {
      result.current.setTitle('Test Poll')
      result.current.setOptions(['Option 1', ''])
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(toast.error).toHaveBeenCalledWith('Need at least 2 options')
  })

  it('blocks submission if wallet is not connected', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    const { result } = renderHook(() => useCreatePollForm())

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    expect(createPoll).not.toHaveBeenCalled()
  })

  it('validates encryption keys for secret polls', async () => {
    const { result } = renderHook(() => useCreatePollForm())

    await act(async () => {
      result.current.setTitle('Secret Poll')
      result.current.setOptions(['Option 1', 'Option 2'])
      result.current.setIsSecret(true)
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(toast.error).toHaveBeenCalledWith('Please generate and save your encryption keys', expect.anything())
    expect(createPoll).not.toHaveBeenCalled()
  })

  it('handles error during poll creation', async () => {
    const mockError = new Error('Transaction failed')
    createPoll.mockRejectedValue(mockError)
    const { result } = renderHook(() => useCreatePollForm())

    await act(async () => {
      result.current.setTitle('Test Poll')
      result.current.setOptions(['Option 1', 'Option 2'])
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to create poll', { id: expect.any(String) })
    expect(formatTransactionError).toHaveBeenCalledWith(expect.any(Error), 'Failed to create poll')
    expect(createPoll).toHaveBeenCalled() // It was called, but rejected
  })

  it('clears keys when secrecy is disabled', async () => {
      const { result } = renderHook(() => useCreatePollForm())
  
      await act(async () => {
        result.current.setIsSecret(true)
        result.current.setGeneratedKeys({ pk: 'test' })
        result.current.setHasSavedKey(true)
      })

      expect(result.current.generatedKeys).not.toBeNull()

      await act(async () => {
        result.current.setIsSecret(false)
      })

      expect(result.current.generatedKeys).toBeNull()
      expect(result.current.hasSavedKey).toBe(false)
  })
})
