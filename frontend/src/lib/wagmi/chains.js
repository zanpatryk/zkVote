import { http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { defineChain } from 'viem'

console.log('DEBUG: wagmi import keys:', Object.keys(require('wagmi')))

export const anvil = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
})

export const supportedChains = [anvil, sepolia]

export const transports = {
  [anvil.id]: http(),
  [sepolia.id]: http(),
}