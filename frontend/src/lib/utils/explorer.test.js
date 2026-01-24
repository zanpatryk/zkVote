import { getExplorerTxUrl, getExplorerAddressUrl } from './explorer'
import { BLOCK_EXPLORERS, DEFAULT_CHAIN_ID } from '@/lib/constants'

describe('explorer utils', () => {
  it('returns correct transaction URL for default chain', () => {
    const hash = '0x123'
    const expected = `${BLOCK_EXPLORERS[DEFAULT_CHAIN_ID]}/tx/${hash}`
    expect(getExplorerTxUrl(hash)).toBe(expected)
  })

  it('returns correct address URL for default chain', () => {
    const address = '0xabc'
    const expected = `${BLOCK_EXPLORERS[DEFAULT_CHAIN_ID]}/address/${address}`
    expect(getExplorerAddressUrl(address)).toBe(expected)
  })

  it('handles unknown chain by falling back to default', () => {
    const hash = '0x123'
    const unknownChainId = 99999
    const expected = `${BLOCK_EXPLORERS[DEFAULT_CHAIN_ID]}/tx/${hash}`
    expect(getExplorerTxUrl(hash, unknownChainId)).toBe(expected)
  })
})
