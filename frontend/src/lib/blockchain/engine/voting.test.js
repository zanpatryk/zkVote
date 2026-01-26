import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { encodeEventTopics, decodeEventLog } from 'viem'
import { 
  hasVoted, 
  getVote, 
  getPollResults, 
  getVoteTransaction, 
  getPollVotes, 
  getZKPollState,
  castVote,
  castVoteWithProof,
  castEncryptedVote,
  castEncryptedVoteWithProof,
  publishEncryptedResults,
  castPlainVote
} from './voting'
import { toast } from 'react-hot-toast'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'

jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
  getAccount: jest.fn(),
}))

jest.mock('./core', () => ({
  getModules: jest.fn().mockResolvedValue({ 
    pollManager: '0xPM', 
    eligibilityModule: '0xEli', 
    voteStorage: '0xVote' 
  })
}))

jest.mock('viem', () => {
  const actual = jest.requireActual('viem')
  return {
    ...actual,
    encodeEventTopics: jest.fn(() => ['0xTopic']),
    decodeEventLog: jest.fn(),
    parseAbiItem: jest.fn(i => i),
  }
})

jest.mock('react-hot-toast')

describe('voting domain engine', () => {
  let mockPublicClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockPublicClient = {
      readContract: jest.fn(),
      getLogs: jest.fn(),
    }
    getPublicClient.mockReturnValue(mockPublicClient)
    getAccount.mockReturnValue({ address: '0xUser' })
    writeContract.mockResolvedValue('0xHash')
    waitForTransactionReceipt.mockResolvedValue({ status: 1, transactionHash: '0xHash', logs: [{ topics: ['0xTopic'] }] })
  })

  describe('getVote', () => {
    it('handles ZK encrypted votes correctly', async () => {
      const { getModules } = require('./core')
      getModules.mockResolvedValueOnce({ voteStorage: '0xZKStorage' })
      getModules.mockResolvedValueOnce({ voteStorage: '0xDefaultStorage' })

      mockPublicClient.readContract.mockResolvedValue({
        voteId: 1n,
        pollId: 10n,
        voter: '0xVoter',
        encVote: [100n, 200n]
      })

      const { data } = await getVote('1', '10')
      expect(data.encVote).toEqual(['100', '200'])
      expect(data.optionIdx).toBeNull()
    })

    it('returns error result on catch', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
      const { error } = await getVote('1', '10')
      expect(error).toContain('Could not fetch vote data')
    })
  })

  describe('getPollResults', () => {
    it('returns formatted results on success', async () => {
      mockPublicClient.readContract.mockResolvedValue([10n, 20n])
      const { data } = await getPollResults('1', 2)
      expect(data).toEqual(['10', '20'])
    })

    it('returns empty array on error', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
      const { data } = await getPollResults('1', 2)
      expect(data).toHaveLength(2) // fallback to zeros
      expect(data[0]).toBe('0')
    })
  })

  describe('getVoteTransaction', () => {
    it('returns transaction hash from logs', async () => {
      mockPublicClient.getLogs.mockResolvedValue([{ transactionHash: '0xTx' }])
      const { data } = await getVoteTransaction('1', '0xUser')
      expect(data).toBe('0xTx')
    })

    it('returns null on error', async () => {
      mockPublicClient.getLogs.mockRejectedValue(new Error('fail'))
      const { data, error } = await getVoteTransaction('1', '0xUser')
      expect(data).toBeNull()
      expect(error).toContain('Could not fetch vote transaction')
    })
  })

  describe('getPollVotes', () => {
    it('parses logs correctly', async () => {
      mockPublicClient.getLogs.mockResolvedValue([{
        args: { voter: '0xV1', voteId: 100n },
        transactionHash: '0xT',
        blockNumber: 1n
      }])
      const { data } = await getPollVotes('1')
      expect(data[0].voteId).toBe('100')
    })

    it('returns empty array on error', async () => {
      mockPublicClient.getLogs.mockRejectedValue(new Error('fail'))
      const { data } = await getPollVotes('1')
      expect(data).toHaveLength(0)
    })
  })

  describe('getZKPollState', () => {
    it('fetches ZK poll details', async () => {
      const { getModules } = require('./core')
      getModules.mockResolvedValue({ voteStorage: CONTRACT_ADDRESSES.zkElGamalVoteVector })

      mockPublicClient.readContract.mockResolvedValue([
        true, 10n, false, '0xV1', '0xV2', '0xOwner'
      ])

      const { data } = await getZKPollState('1')
      expect(data.voteCount).toBe('10')
    })

    it('returns error result on catch', async () => {
       const { getModules } = require('./core')
       getModules.mockResolvedValue({ voteStorage: CONTRACT_ADDRESSES.zkElGamalVoteVector })
       mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
       const { error } = await getZKPollState('1')
       expect(error).toBeDefined()
    })
  })

  describe('castVote', () => {
    it('returns null on error', async () => {
       writeContract.mockRejectedValue(new Error('fail'))
       await expect(castVote('1', 0)).rejects.toThrow()
    })
  })

  describe('castVoteWithProof', () => {
    it('successfully casts a semaphore proof vote', async () => {
      decodeEventLog.mockReturnValue({ args: { voteId: 99n } })
      const result = await castVoteWithProof('1', { optionIndex: 0 }, { nullifier: '123', points: Array(8).fill('1') })
      expect(result.voteId).toBe('99')
    })

    it('handles missing log in vote with proof', async () => {
        waitForTransactionReceipt.mockResolvedValueOnce({ status: 1, transactionHash: '0xH', logs: [] })
        const result = await castVoteWithProof('1', { optionIndex: 0 }, { nullifier: '1', points: Array(8).fill('0') })
        expect(result.voteId).toBeNull()
    })

    it('throws on custom error', async () => {
        const error = new Error('execution reverted: 0xaef0604b')
        writeContract.mockRejectedValue(error)
        await expect(castVoteWithProof('1', { optionIndex: 0 }, { nullifier: '1', points: Array(8).fill('0') })).rejects.toThrow()
    })

    it('throws on generic error', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(castVoteWithProof('1', { optionIndex: 0 }, { nullifier: '1', points: Array(8).fill('0') })).rejects.toThrow()
    })
  })

  describe('castEncryptedVote', () => {
    it('successfully casts encrypted vote and decodes correctly', async () => {
      decodeEventLog.mockReturnValue({ args: { voteId: 77n } })
      const result = await castEncryptedVote('1', Array(64).fill('100'), { a: ['1','2'], b: [['1','2'],['3','4']], c: ['1','2'] })
      expect(result.voteId).toBe('77')
    })

    it('handles missing log in encrypted vote', async () => {
        waitForTransactionReceipt.mockResolvedValueOnce({ status: 1, transactionHash: '0xH', logs: [] })
        const result = await castEncryptedVote('1', ['0'], { a:[], b:[], c:[] })
        expect(result.voteId).toBeNull()
    })

    it('throws on error', async () => {
       writeContract.mockRejectedValue(new Error('fail'))
       await expect(castEncryptedVote('1', ['0'], { a:[], b:[], c:[] })).rejects.toThrow()
    })
  })

  describe('castEncryptedVoteWithProof', () => {
    it('successfully processes secret+anonymous vote', async () => {
       decodeEventLog.mockReturnValue({ args: { voteId: 88n } })
       const result = await castEncryptedVoteWithProof('1', '123', Array(8).fill('1'), Array(64).fill('100'), { a:['1','2'], b:[['1','2'],['3','4']], c:['1','2'] })
       expect(result.voteId).toBe('88')
    })
    
    it('handles missing log case', async () => {
       waitForTransactionReceipt.mockResolvedValueOnce({ status: 1, transactionHash: '0xHash', logs: [] })
       const result = await castEncryptedVoteWithProof('1', '123', Array(8).fill('1'), Array(64).fill('100'), { a:['1','2'], b:[['1','2'],['3','4']], c:['1','2'] })
       expect(result.voteId).toBeNull()
    })

    it('throws on failure', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(castEncryptedVoteWithProof('1', '0', [], [], {})).rejects.toThrow()
    })
  })

  describe('hasVoted', () => {
    it('returns false on error', async () => {
        mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
        const { data } = await hasVoted('1', '0x')
        expect(data).toBe(false)
    })
  })

  describe('castPlainVote', () => {
    it('successfully processes plain vote with manual decoding', async () => {
       decodeEventLog.mockReturnValue({ args: { voteId: 123n } })
       const result = await castPlainVote('1', 0)
       expect(result.voteId).toBe('123')
    })

    it('handles missing log in plain vote', async () => {
        waitForTransactionReceipt.mockResolvedValueOnce({ status: 1, transactionHash: '0xH', logs: [] })
        const result = await castPlainVote('1', 0)
        expect(result.voteId).toBeNull()
    })

    it('throws on plain vote failure', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(castPlainVote('1', 0)).rejects.toThrow()
    })
  })

  describe('publishEncryptedResults', () => {
    it('successfully publishes tally', async () => {
      const result = await publishEncryptedResults('1', Array(16).fill('16'), { a:['1','2'], b:[['1','2'],['3','4']], c:['1','2'] })
      expect(result.success).toBe(true)
    })
    
    it('throws on error', async () => {
       writeContract.mockRejectedValue(new Error('fail'))
       await expect(publishEncryptedResults('1', ['0'], { a:[], b:[], c:[] })).rejects.toThrow()
    })
  })
})
