import { waitForTransactionResilient } from './transaction'
import { waitForTransactionReceipt } from '@wagmi/core'

jest.mock('@wagmi/core', () => ({
  waitForTransactionReceipt: jest.fn(),
}))

describe('waitForTransactionResilient', () => {
  const mockConfig = {}
  const mockHash = '0x123'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('resolves immediately if receipt is found', async () => {
    const mockReceipt = { status: 'success' }
    waitForTransactionReceipt.mockResolvedValue(mockReceipt)

    const result = await waitForTransactionResilient(mockConfig, { hash: mockHash })

    expect(result).toBe(mockReceipt)
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1)
  })

  it('retries on "could not be found" error and succeeds', async () => {
    const errorNotFound = new Error('Transaction receipt could not be found')
    const mockReceipt = { status: 'success' }
    
    waitForTransactionReceipt
      .mockRejectedValueOnce(errorNotFound)
      .mockRejectedValueOnce(errorNotFound)
      .mockResolvedValue(mockReceipt)

    const promise = waitForTransactionResilient(mockConfig, { hash: mockHash, retryDelay: 100 })
    
    // Fast-forward time for retries
    await jest.advanceTimersByTimeAsync(100)
    await jest.advanceTimersByTimeAsync(100)
    
    const result = await promise

    expect(result).toBe(mockReceipt)
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(3)
  })

  it('throws after max retries exhausted', async () => {
    const errorNotFound = new Error('Transaction receipt could not be found')
    waitForTransactionReceipt.mockRejectedValue(errorNotFound)

    const promise = waitForTransactionResilient(mockConfig, { hash: mockHash, retryCount: 2, retryDelay: 100 })
    
    // Catch the rejection to prevent unhandled rejection during time travel
    // We expect it to eventually reject
    const catchPromise = promise.catch(e => e)

    // Advance time enough for all retries
    await jest.runAllTimersAsync()
    
    const error = await catchPromise
    expect(error).toBeDefined()
    expect(error.message).toMatch(/could not be found/)
    
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('throws immediately on non-retryable error', async () => {
    const errorOther = new Error('Some other error')
    waitForTransactionReceipt.mockRejectedValue(errorOther)

    await expect(waitForTransactionResilient(mockConfig, { hash: mockHash }))
      .rejects.toThrow('Some other error')
    
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1)
  })

  it('retries on TransactionReceiptNotFoundError name', async () => {
    const errorNamed = new Error('Unknown message')
    errorNamed.name = 'TransactionReceiptNotFoundError'
    
    const mockReceipt = { status: 'success' }
    
    waitForTransactionReceipt
      .mockRejectedValueOnce(errorNamed)
      .mockResolvedValue(mockReceipt)

    const promise = waitForTransactionResilient(mockConfig, { hash: mockHash, retryDelay: 100 })
    await jest.advanceTimersByTimeAsync(100)
    
    const result = await promise
    expect(result).toBe(mockReceipt)
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(2)
  })
})
