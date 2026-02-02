import { renderHook, waitFor, act } from '@testing-library/react'
import { usePollFunding } from './usePollFunding'
import { getPollBudget, fundPollBudget, withdrawPollBudget } from '@/lib/blockchain/engine/paymaster'
import { toast } from 'react-hot-toast'
import { parseEther } from 'viem'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/paymaster', () => ({
  getPollBudget: jest.fn(),
  fundPollBudget: jest.fn(),
  withdrawPollBudget: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
    error: jest.fn(),
  }
}))

jest.mock('viem', () => ({
  parseEther: jest.fn(val => BigInt(val * 1e18)),
}))

describe('usePollFunding', () => {
  const mockPollId = '123'

  beforeEach(() => {
    jest.clearAllMocks()
    getPollBudget.mockResolvedValue({ data: 100n, error: null })
  })

  it('initializes and fetches balance', async () => {
    const { result } = renderHook(() => usePollFunding(mockPollId))
    
    expect(result.current.isLoadingBalance).toBe(true)
    await waitFor(() => expect(result.current.isLoadingBalance).toBe(false))
    
    expect(getPollBudget).toHaveBeenCalledWith(mockPollId)
    expect(result.current.balance).toBe(100n)
  })

  it('handles fetch error', async () => {
    getPollBudget.mockResolvedValue({ data: null, error: 'Fetch failed' })
    const { result } = renderHook(() => usePollFunding(mockPollId))
    
    await waitFor(() => expect(result.current.isLoadingBalance).toBe(false))
    expect(toast.error).toHaveBeenCalledWith('Fetch failed')
    expect(result.current.balance).toBe(0n)
  })

  it('funds poll successfully', async () => {
    const { result } = renderHook(() => usePollFunding(mockPollId))
    await waitFor(() => expect(result.current.isLoadingBalance).toBe(false))

    fundPollBudget.mockResolvedValue({})
    
    await act(async () => {
      await result.current.fund('1')
    })
    
    expect(fundPollBudget).toHaveBeenCalledWith(mockPollId, BigInt(1e18))
    expect(toast.success).toHaveBeenCalled()
    expect(getPollBudget).toHaveBeenCalledTimes(2) // Initial + After fund
  })

  it('validates fund amount', async () => {
    const { result } = renderHook(() => usePollFunding(mockPollId))
    
    await act(async () => {
      await result.current.fund('-1')
    })
    
    expect(toast.error).toHaveBeenCalledWith('Please enter a positive amount of ETH.')
    expect(fundPollBudget).not.toHaveBeenCalled()
  })

  it('withdraws funds successfully', async () => {
    const { result } = renderHook(() => usePollFunding(mockPollId))
    await waitFor(() => expect(result.current.balance).toBe(100n))
    
    withdrawPollBudget.mockResolvedValue({})
    
    await act(async () => {
      await result.current.withdrawAll()
    })
    
    expect(withdrawPollBudget).toHaveBeenCalledWith(mockPollId, 100n)
    expect(toast.success).toHaveBeenCalled()
  })

  it('prevents withdraw if balance is 0', async () => {
    getPollBudget.mockResolvedValue({ data: 0n, error: null })
    const { result } = renderHook(() => usePollFunding(mockPollId))
    await waitFor(() => expect(result.current.balance).toBe(0n))
    
    await act(async () => {
      await result.current.withdrawAll()
    })
    
    expect(toast.error).toHaveBeenCalledWith('No funds available to withdraw.')
    expect(withdrawPollBudget).not.toHaveBeenCalled()
  })
})
