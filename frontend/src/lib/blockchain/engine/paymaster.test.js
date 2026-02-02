
import { getPollBudget, fundPollBudget, withdrawPollBudget } from './paymaster'
import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { createHttpPublicClient } from '@/lib/wagmi/chains'
import { getAddresses, pollManagerContract } from '@/lib/contracts'
import { getModules } from './core'

jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
  getAccount: jest.fn()
}))

jest.mock('@/lib/wagmi/chains', () => ({
  createHttpPublicClient: jest.fn(),
  anvil: { id: 31337 },
  sepolia: { id: 11155111 },
}))

jest.mock('@/lib/contracts')
jest.mock('./core')
jest.mock('@/lib/wagmi/config', () => ({
  wagmiConfig: {}
}))

describe('paymaster engine', () => {
  const mockPublicClient = {
    readContract: jest.fn(),
    getLogs: jest.fn(),
    chain: { id: 31337 }
  }

  const mockAddresses = {
    paymaster: '0xPaymaster',
    vse: '0xVSE',
    entryPoint: '0xEntryPoint'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    getPublicClient.mockReturnValue(mockPublicClient)
    createHttpPublicClient.mockReturnValue(mockPublicClient)
    getAccount.mockReturnValue({ address: '0xUser', chainId: 31337 })
    getAddresses.mockReturnValue(mockAddresses)
    getModules.mockResolvedValue({ pollManager: '0xPollManager' })
    mockPublicClient.readContract.mockReset()
  })

  describe('getPollBudget', () => {
    it('returns 0 if no pollId provided', async () => {
      const result = await getPollBudget(null)
      expect(result).toEqual({ data: 0n, error: null })
    })

    it('returns budget amount on success', async () => {
      mockPublicClient.readContract.mockResolvedValue(100n)
      
      const result = await getPollBudget('1')
      
      expect(result.data).toBe(100n)
      expect(result.error).toBeNull()
      expect(mockPublicClient.readContract).toHaveBeenCalledWith(expect.objectContaining({
        address: mockAddresses.paymaster,
        functionName: 's_pollBudgets',
        args: [1n]
      }))
    })

    it('handles errors gracefully', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('RPC Error'))
      
      const result = await getPollBudget('1')
      
      expect(result.data).toBe(0n)
      expect(result.error).toContain('Failed to fetch poll budget')
    })
  })

  describe('fundPollBudget', () => {
    it('throws if wallet not connected', async () => {
      getAccount.mockReturnValue({ address: null })
      await expect(fundPollBudget('1', 100n)).rejects.toThrow('Wallet not connected')
    })

    it('successfully funds poll', async () => {
      writeContract.mockResolvedValue('0xHash')
      waitForTransactionReceipt.mockResolvedValue({ status: 'success' })

      const result = await fundPollBudget('1', 100n)

      expect(result).toBe(true)
      expect(writeContract).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        address: mockAddresses.paymaster,
        functionName: 'fundPoll',
        args: [1n],
        value: 100n
      }))
    })

    it('throws if transaction reverted', async () => {
      writeContract.mockResolvedValue('0xHash')
      waitForTransactionReceipt.mockResolvedValue({ status: 'reverted' })

      await expect(fundPollBudget('1', 100n)).rejects.toThrow('Transaction REVERTED')
    })
  })

  describe('withdrawPollBudget', () => {
    beforeEach(() => {
      // Default successful chain read setup for withdraw
      mockPublicClient.readContract.mockImplementation(async ({ functionName }) => {
        if (functionName === 's_pollBudgets') return 500n // Budget
        if (functionName === 'getPollOwner') return '0xUser' // Owner matches connected user
        if (functionName === 'balanceOf') return 1000n // EntryPoint deposit
        return null
      })
    })

    it('throws if wallet not connected', async () => {
      getAccount.mockReturnValue({ address: null })
      await expect(withdrawPollBudget('1', 100n)).rejects.toThrow('Wallet not connected')
    })

    it('throws if budget is 0 on chain', async () => {
      mockPublicClient.readContract.mockImplementation(async ({ functionName }) => {
        if (functionName === 's_pollBudgets') return 0n
        if (functionName === 'getPollOwner') return '0xUser'
        return 0n
      })

      await expect(withdrawPollBudget('1', 100n)).rejects.toThrow('No budget available')
    })

    it('throws if connected user is not poll owner', async () => {
      mockPublicClient.readContract.mockImplementation(async ({ functionName }) => {
        if (functionName === 's_pollBudgets') return 500n
        if (functionName === 'getPollOwner') return '0xOtherUser'
        return 1000n
      })

      await expect(withdrawPollBudget('1', 100n)).rejects.toThrow('Address mismatch')
    })

    it('warns if entry point deposit is less than budget', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      
      mockPublicClient.readContract.mockImplementation(async ({ functionName }) => {
        if (functionName === 's_pollBudgets') return 500n
        if (functionName === 'getPollOwner') return '0xUser'
        if (functionName === 'balanceOf') return 100n // Deposit < Budget
        return null
      })

      writeContract.mockResolvedValue('0xHash')
      waitForTransactionReceipt.mockResolvedValue({ status: 'success' })

      await withdrawPollBudget('1', 100n)

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('EntryPoint deposit'))
      consoleSpy.mockRestore()
    })

    it('successfully withdraws poll budget', async () => {
      writeContract.mockResolvedValue('0xHash')
      waitForTransactionReceipt.mockResolvedValue({ status: 'success' })

      const result = await withdrawPollBudget('1', 100n)

      expect(result).toBe(true)
      expect(writeContract).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
        address: mockAddresses.paymaster,
        functionName: 'withdrawPoll',
        args: [1n, '0xUser', 100n]
      }))
    })
  })
})
