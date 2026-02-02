import { waitForTransactionReceipt } from '@wagmi/core'

/**
 * Resilient wrapper for waitForTransactionReceipt that handles Sepolia latency
 * and RPC sync delays.
 * 
 * @param {import('@wagmi/core').Config} config 
 * @param {Object} options 
 * @param {string} options.hash - Transaction hash
 * @param {number} [options.retryCount=3] - Number of times to retry if receipt not found
 * @param {number} [options.retryDelay=3000] - Delay between retries in ms
 * @returns {Promise<import('viem').TransactionReceipt>}
 */
export async function waitForTransactionResilient(config, { hash, retryCount = 5, retryDelay = 4000 }) {
  let lastError;
  
  for (let i = 0; i <= retryCount; i++) {
    try {
      // We use a generous timeout for the actual wait
      return await waitForTransactionReceipt(config, { 
        hash, 
        timeout: 120_000, // 2 minutes
        confirmations: 1 
      })
    } catch (err) {
      lastError = err
      
      // If it's a "Transaction receipt could not be found" error, we retry
      const isNotFound = err.message?.toLowerCase().includes('could not be found') || 
                         err.name === 'TransactionReceiptNotFoundError'
      
      if (isNotFound && i < retryCount) {
        console.warn(`Transaction receipt for ${hash} not found yet (attempt ${i + 1}/${retryCount + 1}). Retrying in ${retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }
      
      // If it's a timeout or other error, or we've run out of retries, throw
      throw err
    }
  }
  
  throw lastError;
}
