import anvil from '../deployments/31337.json'
import sepolia from '../deployments/11155111.json'
import { DEFAULT_CHAIN_ID } from '../constants'

const deployments = {
  31337: anvil,
  11155111: sepolia
}

export function getAddresses(chainId) {
  return deployments[chainId] || deployments[DEFAULT_CHAIN_ID]
}

// Keep static export for simpler usage where chainId isn't available (defaults to env-like behavior)
// This maintains backward compatibility with existing imports, but uses the DEFAULT_CHAIN_ID
export const CONTRACT_ADDRESSES = getAddresses(DEFAULT_CHAIN_ID)

export default CONTRACT_ADDRESSES
