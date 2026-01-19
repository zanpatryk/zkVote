import { BLOCK_EXPLORERS, DEFAULT_CHAIN_ID } from '@/lib/constants'

/**
 * Get block explorer URL for a transaction
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID (defaults to DEFAULT_CHAIN_ID)
 * @returns {string} Full URL to transaction on block explorer
 */
export function getExplorerTxUrl(txHash, chainId = DEFAULT_CHAIN_ID) {
  const baseUrl = BLOCK_EXPLORERS[chainId] || BLOCK_EXPLORERS[DEFAULT_CHAIN_ID]
  return `${baseUrl}/tx/${txHash}`
}

/**
 * Get block explorer URL for an address
 * @param {string} address - Wallet address
 * @param {number} chainId - Chain ID (defaults to DEFAULT_CHAIN_ID)
 * @returns {string} Full URL to address on block explorer
 */
export function getExplorerAddressUrl(address, chainId = DEFAULT_CHAIN_ID) {
  const baseUrl = BLOCK_EXPLORERS[chainId] || BLOCK_EXPLORERS[DEFAULT_CHAIN_ID]
  return `${baseUrl}/address/${address}`
}
