import { renderHook } from '@testing-library/react'
import { useExplorer } from './useExplorer'
import { BLOCK_EXPLORERS } from '@/lib/constants'

// Mock wagmi
jest.mock('wagmi', () => ({
  useChainId: jest.fn(),
}))

// Get the mocked function for manipulation in tests
import { useChainId } from 'wagmi'

describe('useExplorer Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTxUrl', () => {
    it('returns correct Sepolia Etherscan URL for Sepolia chain', () => {
      useChainId.mockReturnValue(11155111)

      const { result } = renderHook(() => useExplorer())

      const txHash = '0xabc123'
      const url = result.current.getTxUrl(txHash)

      expect(url).toBe(`${BLOCK_EXPLORERS[11155111]}/tx/${txHash}`)
      expect(url).toContain('sepolia.etherscan.io')
    })

    it('returns correct Basescan URL for Base Sepolia chain', () => {
      useChainId.mockReturnValue(84532)

      const { result } = renderHook(() => useExplorer())

      const txHash = '0xdef456'
      const url = result.current.getTxUrl(txHash)

      expect(url).toBe(`${BLOCK_EXPLORERS[84532]}/tx/${txHash}`)
      expect(url).toContain('sepolia.basescan.org')
    })

    it('returns Sepolia Etherscan URL for Anvil/local chain', () => {
      useChainId.mockReturnValue(31337)

      const { result } = renderHook(() => useExplorer())

      const txHash = '0x789abc'
      const url = result.current.getTxUrl(txHash)

      expect(url).toBe(`${BLOCK_EXPLORERS[31337]}/tx/${txHash}`)
      expect(url).toContain('sepolia.etherscan.io')
    })

    it('falls back to default chain for unknown chain IDs', () => {
      useChainId.mockReturnValue(99999) // Unknown chain

      const { result } = renderHook(() => useExplorer())

      const txHash = '0xunknown'
      const url = result.current.getTxUrl(txHash)

      // Should fall back to default chain (31337 -> Sepolia)
      expect(url).toContain('/tx/0xunknown')
    })
  })

  describe('getAddressUrl', () => {
    it('returns correct Sepolia Etherscan address URL', () => {
      useChainId.mockReturnValue(11155111)

      const { result } = renderHook(() => useExplorer())

      const address = '0x1234567890abcdef'
      const url = result.current.getAddressUrl(address)

      expect(url).toBe(`${BLOCK_EXPLORERS[11155111]}/address/${address}`)
      expect(url).toContain('sepolia.etherscan.io/address/')
    })

    it('returns correct Basescan address URL for Base Sepolia', () => {
      useChainId.mockReturnValue(84532)

      const { result } = renderHook(() => useExplorer())

      const address = '0xfedcba0987654321'
      const url = result.current.getAddressUrl(address)

      expect(url).toBe(`${BLOCK_EXPLORERS[84532]}/address/${address}`)
      expect(url).toContain('sepolia.basescan.org/address/')
    })
  })

  describe('chainId', () => {
    it('exposes the current chain ID', () => {
      useChainId.mockReturnValue(84532)

      const { result } = renderHook(() => useExplorer())

      expect(result.current.chainId).toBe(84532)
    })

    it('updates when chain changes', () => {
      useChainId.mockReturnValue(11155111)

      const { result, rerender } = renderHook(() => useExplorer())

      expect(result.current.chainId).toBe(11155111)

      // Simulate chain change
      useChainId.mockReturnValue(84532)
      rerender()

      expect(result.current.chainId).toBe(84532)
    })
  })

  describe('chain switching behavior', () => {
    it('returns different URLs after chain switch', () => {
      const txHash = '0xsameHash'

      // Start on Sepolia
      useChainId.mockReturnValue(11155111)
      const { result, rerender } = renderHook(() => useExplorer())

      const sepoliaUrl = result.current.getTxUrl(txHash)
      expect(sepoliaUrl).toContain('sepolia.etherscan.io')

      // Switch to Base Sepolia
      useChainId.mockReturnValue(84532)
      rerender()

      const baseUrl = result.current.getTxUrl(txHash)
      expect(baseUrl).toContain('sepolia.basescan.org')

      // URLs should be different
      expect(sepoliaUrl).not.toBe(baseUrl)
    })
  })
})
