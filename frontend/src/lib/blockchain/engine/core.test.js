import { getPublicClient } from '@wagmi/core'
import { getModules } from './core'

jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
}))

jest.mock('@/lib/wagmi/config', () => ({
  wagmiConfig: {},
}))

describe('core blockchain engine', () => {
  let mockPublicClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockPublicClient = {
      readContract: jest.fn(),
      multicall: jest.fn(),
    }
    getPublicClient.mockReturnValue(mockPublicClient)
  })

  describe('getModules', () => {
    it('returns system defaults when no pollId is provided', async () => {
      mockPublicClient.readContract
        .mockResolvedValueOnce('0xPollManager')
        .mockResolvedValueOnce('0xDefaultEli')
        .mockResolvedValueOnce('0xDefaultVote')

      const result = await getModules()

      expect(result).toEqual({
        pollManager: '0xPollManager',
        eligibilityModule: '0xDefaultEli',
        voteStorage: '0xDefaultVote'
      })
    })

    it('returns poll-specific modules when pollId is provided', async () => {
      mockPublicClient.readContract
        .mockResolvedValueOnce('0xGlobalPM')
        .mockResolvedValueOnce('0xDefaultEli')
        .mockResolvedValueOnce('0xDefaultVote')
        .mockResolvedValueOnce('0xPollEli')
        .mockResolvedValueOnce('0xPollVote')

      const result = await getModules('123')

      expect(result.eligibilityModule).toBe('0xPollEli')
      expect(result.voteStorage).toBe('0xPollVote')
    })
    
    it('fallbacks to defaults if poll modules are zero address', async () => {
      mockPublicClient.readContract
        .mockResolvedValueOnce('0xGlobalPM')
        .mockResolvedValueOnce('0xDefaultEli')
        .mockResolvedValueOnce('0xDefaultVote')
        .mockResolvedValueOnce('0x0000000000000000000000000000000000000000')
        .mockResolvedValueOnce('0x0000000000000000000000000000000000000000')

      const result = await getModules('123')

      expect(result.eligibilityModule).toBe('0xDefaultEli')
      expect(result.voteStorage).toBe('0xDefaultVote')
    })

    it('throws custom error on failure', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('RPC Fail'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      await expect(getModules()).rejects.toThrow('Failed to connect to blockchain')
      
      consoleSpy.mockRestore()
    })
  })
})
