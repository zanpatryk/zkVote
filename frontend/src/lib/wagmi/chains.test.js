import { anvil, supportedChains, transports } from './chains'
import { sepolia } from 'wagmi/chains'

describe('wagmi chains', () => {
  it('defines anvil chain correctly', () => {
    expect(anvil.id).toBe(31337)
    expect(anvil.name).toBe('Anvil')
    expect(anvil.testnet).toBe(true)
  })

  it('includes required chains', () => {
    expect(supportedChains).toContain(anvil)
    expect(supportedChains).toContain(sepolia)
  })

  it('configures transports for all supported chains', () => {
    expect(transports[anvil.id]).toBeDefined()
    expect(transports[sepolia.id]).toBeDefined()
  })
})
