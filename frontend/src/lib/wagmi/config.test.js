import { wagmiConfig } from './config'

jest.mock('@rainbow-me/rainbowkit', () => ({
  getDefaultConfig: jest.fn(({ appName, projectId, chains, transports }) => ({
    appName,
    projectId,
    chains,
    transports,
    mockConfig: true
  })),
}))

describe('wagmi config', () => {
  it('initializes config with correct parameters', () => {
    expect(wagmiConfig.appName).toBe('zkVote')
    expect(wagmiConfig.mockConfig).toBe(true)
    expect(wagmiConfig.chains).toBeDefined()
    expect(wagmiConfig.transports).toBeDefined()
  })

  it('uses default projectId when env is missing', () => {
    // Since config.js is executed on import, we check what was exported
    // Default in config.js is 'local_dev'
    expect(wagmiConfig.projectId).toBe('local_dev')
  })
})
