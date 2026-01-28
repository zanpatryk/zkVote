import { getPublicClient, getAccount } from '@wagmi/core'
import { getModules, modulesCache } from './core'

jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
  getAccount: jest.fn(),
}))

jest.mock('@/lib/wagmi/config', () => ({
  wagmiConfig: {
    state: { chainId: 31337 }
  },
}))

jest.mock('@/lib/contracts', () => ({
  votingSystemContract: { abi: [] },
  PollManagerABI: [],
  getAddresses: jest.fn(() => ({
    vse: '0xVotingSystem',
    eligibilityV0: '0xDefaultEli',
    semaphoreEligibility: '0xSemEli',
    startBlock: 0
  }))
}))

describe('core blockchain engine', () => {
  let mockPublicClient

  beforeEach(() => {
    jest.clearAllMocks()
    modulesCache.clear()
    
    mockPublicClient = {
      readContract: jest.fn(),
      multicall: jest.fn(),
      chain: { id: 31337 },
    }
    getPublicClient.mockReturnValue(mockPublicClient)
    getAccount.mockReturnValue({ chainId: 31337 })
  })

  describe('getModules', () => {
    it('returns system defaults when no pollId is provided', async () => {
      mockPublicClient.multicall.mockResolvedValueOnce([
        '0xPollManager',
        '0xDefaultEli',
        '0xDefaultVote'
      ])

      const result = await getModules()

      expect(result).toEqual({
        pollManager: '0xPollManager',
        eligibilityModule: '0xDefaultEli',
        voteStorage: '0xDefaultVote'
      })
      expect(mockPublicClient.multicall).toHaveBeenCalledWith(expect.objectContaining({
        contracts: expect.arrayContaining([
            expect.objectContaining({ functionName: 's_pollManager' })
        ])
      }))
    })

    it('returns poll-specific modules when pollId is provided', async () => {
      // Use a different pollId to avoid cache from previous test if any
      const pollId = '1'
      mockPublicClient.multicall.mockResolvedValueOnce([
        '0xGlobalPM',
        '0xDefaultEli',
        '0xDefaultVote',
        '0xPollEli',
        '0xPollVote'
      ])

      const result = await getModules(pollId)

      expect(result.eligibilityModule).toBe('0xPollEli')
      expect(result.voteStorage).toBe('0xPollVote')
    })
    
    it('fallbacks to defaults if poll modules are zero address', async () => {
      const pollId = '2'
      mockPublicClient.multicall.mockResolvedValueOnce([
        '0xGlobalPM',
        '0xDefaultEli',
        '0xDefaultVote',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000'
      ])

      const result = await getModules(pollId)

      expect(result.eligibilityModule).toBe('0xDefaultEli')
      expect(result.voteStorage).toBe('0xDefaultVote')
    })

    it('uses cache on subsequent calls', async () => {
        const pollId = '3'
        mockPublicClient.multicall.mockResolvedValueOnce([
            '0xPM', '0xEli', '0xVote', '0xPEli', '0xPVote'
        ])

        // First call
        await getModules(pollId)
        expect(mockPublicClient.multicall).toHaveBeenCalledTimes(1)

        // Second call
        const result = await getModules(pollId)
        expect(mockPublicClient.multicall).toHaveBeenCalledTimes(1) // Should NOT increment
        expect(result.eligibilityModule).toBe('0xPEli')
    })

    it('throws custom error on failure', async () => {
      mockPublicClient.multicall.mockRejectedValue(new Error('RPC Fail'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      await expect(getModules('4')).rejects.toThrow('Failed to connect to blockchain')
      
      consoleSpy.mockRestore()
    })
  })
})
