import anvil from '../deployments/31337.json'
import sepolia from '../deployments/11155111.json'
import baseSepolia from '../deployments/84532.json'
import { DEFAULT_CHAIN_ID } from '../constants'

const deployments = {
  31337: anvil,
  11155111: sepolia,
  84532: baseSepolia
}

const startBlocks = {
  31337: 0n,
  11155111: 10142196n,
  84532: 37072547n
}

export function getAddresses(chainId) {
  const addresses = deployments[chainId] || deployments[DEFAULT_CHAIN_ID]
  const startBlock = startBlocks[chainId] || 0n
  return { ...addresses, startBlock }
}

export function getStartBlock(chainId) {
  return startBlocks[chainId] || 0n
}

export const CONTRACT_ADDRESSES = getAddresses(DEFAULT_CHAIN_ID)

export default CONTRACT_ADDRESSES
