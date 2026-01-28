import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { 
  getPollById, 
  getOwnedPolls, 
  getWhitelistedPolls, 
  createPoll, 
  startPoll, 
  endPoll 
} from './polls'
import { toast } from 'react-hot-toast'

jest.mock('@/lib/contracts', () => ({
  votingSystemContract: { abi: [], address: '0xVSE' },
  PollManagerABI: [],
  pollManagerContract: { abi: [] },
  CONTRACT_ADDRESSES: { zkElGamalVoteVector: '0xZK' },
  getAddresses: jest.fn(() => ({
    vse: '0xVSE',
    vse: '0xVSE',
    zkElGamalVoteVector: '0xZK',
    elgamalVoteVerifier: '0xEVV',
    elgamalTallyVerifier: '0xETV',
    eligibilityV0: '0xEliV0',
    semaphoreEligibility: '0xSemEli',
    startBlock: 0
  }))
}))
jest.mock('react-hot-toast', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }
}))

jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
  getAccount: jest.fn(),
}))

jest.mock('./core', () => ({
  getModules: jest.fn().mockResolvedValue({ pollManager: '0xPM' })
}))

jest.mock('viem', () => {
  const actual = jest.requireActual('viem')
  return {
    ...actual,
    parseAbiItem: jest.fn(i => i),
    encodeAbiParameters: jest.fn(() => '0x'),
    parseAbiParameters: jest.fn(i => i),
    encodeEventTopics: jest.fn(() => ['0x']),
    decodeEventLog: jest.fn(),
  }
})

describe('polls domain engine', () => {
  let mockPublicClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockPublicClient = {
      readContract: jest.fn(),
      getLogs: jest.fn(),
      getBlockNumber: jest.fn().mockResolvedValue(100n),
      chain: { id: 31337 },
    }
    getPublicClient.mockReturnValue(mockPublicClient)
    getAccount.mockReturnValue({ address: '0xUser' })
    writeContract.mockResolvedValue('0xHash')
    waitForTransactionReceipt.mockResolvedValue({ status: 1, logs: [{ topics: ['0x'] }] })
  })

  describe('getPollById', () => {
    it('returns empty if pollId is missing', async () => {
      const { data } = await getPollById(null)
      expect(data).toBeNull()
    })

    it('fetches and formats poll data correctly', async () => {
      mockPublicClient.readContract
        .mockResolvedValueOnce([123n, '0xOwner', 'Title', 'Desc', ['Opt1', 'Opt2'], 1])

      const { data, error } = await getPollById('123')

      expect(error).toBeNull()
      expect(data.pollId).toBe('123')
      expect(data.title).toBe('Title')
      expect(data.options).toHaveLength(2)
    })

    it('returns error on contract failure', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
      const { error } = await getPollById('1')
      expect(error).toContain('Could not fetch poll data')
    })
  })

  describe('getOwnedPolls', () => {
    it('returns empty if address is missing', async () => {
      const { data } = await getOwnedPolls(null)
      expect(data).toHaveLength(0)
    })

    it('parses logs and fetches poll details', async () => {
      mockPublicClient.getLogs.mockResolvedValue([{ args: { pollId: 10n } }])
      mockPublicClient.readContract.mockResolvedValue([10n, '0xO', 'T1', 'D', [], 1])

      const { data } = await getOwnedPolls('0xOwner')
      expect(data).toHaveLength(1)
      expect(data[0].pollId).toBe('10')
    })

    it('returns error on log fetch failure', async () => {
       mockPublicClient.getLogs.mockRejectedValue(new Error('fail'))
       const { error } = await getOwnedPolls('0x')
       expect(error).toContain('Could not fetch owned polls')
    })
  })

  describe('createPoll', () => {
    it('successfully creates a poll and returns ID', async () => {
       const { decodeEventLog } = require('viem')
       decodeEventLog.mockReturnValue({ args: { pollId: 123n } })
       
       const pollId = await createPoll({ title: 'T', options: ['A'] })
       expect(pollId).toBe('123')
    })

    it('throws on error', async () => {
       writeContract.mockRejectedValue(new Error('fail'))
       await expect(createPoll({ title: 'T' })).rejects.toThrow()
    })
  })

  describe('getWhitelistedPolls', () => {
    it('returns empty if address missing', async () => {
        const { data } = await getWhitelistedPolls(null)
        expect(data).toHaveLength(0)
    })

    it('returns error on catch', async () => {
        mockPublicClient.getLogs.mockRejectedValue(new Error('fail'))
        const { error } = await getWhitelistedPolls('0x')
        expect(error).toContain('Could not fetch whitelisted polls')
    })

    it('handles nested promise rejection correctly', async () => {
       mockPublicClient.getLogs.mockResolvedValue([{ args: { pollId: 1n } }])
       // Simulate getPollById internal failure (though it has its own catch, we want to see if the loop handles it)
       mockPublicClient.readContract.mockRejectedValueOnce(new Error('getModules fail')) // for getModules global
       const { error } = await getWhitelistedPolls('0x')
       expect(error).toBeDefined()
    })
  })

  describe('startPoll', () => {
    it('throws on error', async () => {
      writeContract.mockRejectedValue(new Error('fail'))
      await expect(startPoll('1')).rejects.toThrow()
    })
  })

  describe('endPoll', () => {
    it('throws on error', async () => {
      writeContract.mockRejectedValue(new Error('fail'))
      await expect(endPoll('1')).rejects.toThrow()
    })
  })
})
