import { http } from 'wagmi'
import { sepolia as sepoliaChain, baseSepolia as baseSepoliaChain } from 'wagmi/chains'
import { defineChain, createPublicClient, http as viemHttp } from 'viem'

// Custom RPC URLs - use environment variables or fallback to defaults
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
const BASE_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
const ANVIL_RPC_URL = 'http://127.0.0.1:8545'

export const anvil = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [ANVIL_RPC_URL] },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  testnet: true,
})

// Override Sepolia RPC URLs to use our custom endpoint
export const sepolia = {
  ...sepoliaChain,
  rpcUrls: {
    ...sepoliaChain.rpcUrls,
    default: { http: [SEPOLIA_RPC_URL] },
  },
}

// Base Sepolia with custom RPC
export const baseSepolia = {
  ...baseSepoliaChain,
  rpcUrls: {
    ...baseSepoliaChain.rpcUrls,
    default: { http: [BASE_SEPOLIA_RPC_URL] },
  },
}

export const supportedChains = [sepolia, baseSepolia, anvil]

export const transports = {
  [anvil.id]: http(ANVIL_RPC_URL),
  [sepolia.id]: http(SEPOLIA_RPC_URL),
  [baseSepolia.id]: http(BASE_SEPOLIA_RPC_URL),
}

// RPC URL lookup by chainId
export const rpcUrls = {
  [anvil.id]: ANVIL_RPC_URL,
  [sepolia.id]: SEPOLIA_RPC_URL,
  [baseSepolia.id]: BASE_SEPOLIA_RPC_URL,
}

// Chain lookup by ID
export const chainById = {
  [anvil.id]: anvil,
  [sepolia.id]: sepolia,
  [baseSepolia.id]: baseSepolia,
}

/**
 * Creates a public client with explicit HTTP transport.
 * This bypasses the wallet's injected provider to ensure we use our configured RPC URLs.
 */
export function createHttpPublicClient(chainId) {
  const chain = chainById[chainId] || sepolia
  const rpcUrl = rpcUrls[chainId] || SEPOLIA_RPC_URL
  
  return createPublicClient({
    chain,
    transport: viemHttp(rpcUrl),
  })
}