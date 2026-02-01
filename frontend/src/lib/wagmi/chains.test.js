import { anvil, sepolia, supportedChains, transports } from './chains'

describe('wagmi chains', () => {
  it('defines anvil chain correctly', () => {
    expect(anvil.id).toBe(31337)
    expect(anvil.name).toBe('Anvil')
    expect(anvil.testnet).toBe(true)
  })

  it('defines sepolia with custom RPC', () => {
    expect(sepolia.id).toBe(11155111)
    expect(sepolia.name).toBe('Sepolia')
    expect(sepolia.rpcUrls.default.http[0]).toBeDefined()
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
