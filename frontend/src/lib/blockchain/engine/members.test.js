import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { 
  getWhitelistedAddresses, 
  getMerkleTreeDepth, 
  getGroupMembers, 
  isUserWhitelisted, 
  isUserRegistered,
  whitelistUser, 
  whitelistUsers, 
  addMember 
} from './members'
import { toast } from 'react-hot-toast'
import { getModules } from './core'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'

jest.mock('@/lib/wagmi/config', () => ({
  wagmiConfig: {
    state: { chainId: 31337 }
  }
}))

jest.mock('@/lib/contracts', () => ({
  CONTRACT_ADDRESSES: { semaphoreEligibility: '0xSemEli' },
  votingSystemContract: { abi: [], address: '0xVSE' },
  SemaphoreEligibilityModuleABI: [],
  getAddresses: jest.fn(() => ({
    vse: '0xVSE',
    semaphoreEligibility: '0xSemEli',
    startBlock: 0
  }))
}))

jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
  getAccount: jest.fn(),
}))

jest.mock('./core', () => ({
  getModules: jest.fn().mockResolvedValue({ eligibilityModule: '0xEli' })
}))

jest.mock('viem', () => {
  const actual = jest.requireActual('viem')
  return {
    ...actual,
    parseAbiItem: jest.fn(i => i),
  }
})

describe('members domain engine', () => {
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
    waitForTransactionReceipt.mockResolvedValue({ status: 1 })
  })

  describe('getWhitelistedAddresses', () => {
    it('returns empty if pollId missing', async () => {
      const { data } = await getWhitelistedAddresses(null)
      expect(data).toHaveLength(0)
    })

    it('returns array of addresses from logs', async () => {
       mockPublicClient.getLogs
         .mockResolvedValueOnce([{ args: { user: '0xV1', pollId: 1n } }]) // Standard
         .mockResolvedValueOnce([{ args: { user: '0xV2', pollId: 1n } }]) // V0
        const { data } = await getWhitelistedAddresses('1')
        expect(data).toHaveLength(2)
        expect(data).toContain('0xV1')
        expect(data).toContain('0xV2')
    })

    it('handles one log type failing', async () => {
        mockPublicClient.getLogs
          .mockRejectedValueOnce(new Error('Standard fail'))
          .mockResolvedValueOnce([{ args: { user: '0xV2', pollId: 1n } }])
        const { data } = await getWhitelistedAddresses('1')
        expect(data).toEqual(['0xV2'])
    })

    it('returns error on catch', async () => {
      const core = require('./core')
      core.getModules.mockRejectedValueOnce(new Error('fail'))
      const { error } = await getWhitelistedAddresses('1')
      expect(error).toContain('Could not fetch whitelisted addresses')
    })
  })

  describe('getMerkleTreeDepth', () => {
    it('returns default 0 if pollId missing', async () => {
      const { data } = await getMerkleTreeDepth(null)
      expect(data).toBe(0)
    })

    it('returns depth from contract', async () => {
        // Mock getModules to return Semaphore contract
        getModules.mockResolvedValueOnce({ 
            eligibilityModule: CONTRACT_ADDRESSES.semaphoreEligibility 
        })
        mockPublicClient.readContract.mockResolvedValueOnce(32n)
        const { data } = await getMerkleTreeDepth('1')
        expect(data).toBe(32)
    })

    it('defaults to 0 on contract failure', async () => {
        // Mock getModules to return Semaphore contract
        getModules.mockResolvedValue({ 
            eligibilityModule: CONTRACT_ADDRESSES.semaphoreEligibility 
        })
        mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
        const { data } = await getMerkleTreeDepth('1')
        expect(data).toBe(0)
    })

    it('returns 0 if not a semaphore module', async () => {
        getModules.mockResolvedValueOnce({ eligibilityModule: '0xOther' })
        const { data } = await getMerkleTreeDepth('1')
        expect(data).toBe(0)
    })
  })

  describe('getGroupMembers', () => {
    it('returns empty if pollId missing', async () => {
        const { data } = await getGroupMembers(null)
        expect(data).toHaveLength(0)
    })

    it('parses registration logs correctly', async () => {
      mockPublicClient.getLogs.mockResolvedValue([
        { args: { identityCommitment: 100n, groupId: 1n }, transactionHash: '0x1', blockNumber: 1n }
      ])
      const { data } = await getGroupMembers('1')
      expect(data[0].identityCommitment).toBe('100')
    })

    it('returns error on log failure', async () => {
        mockPublicClient.getLogs.mockRejectedValue(new Error('fail'))
        const { error } = await getGroupMembers('1')
        expect(error).toContain('Could not fetch group members')
    })
  })

  describe('isUserWhitelisted', () => {
    it('returns true if whitelisted', async () => {
        mockPublicClient.readContract.mockResolvedValueOnce(true)
        const { data } = await isUserWhitelisted('1', '0xUser')
        expect(data).toBe(true)
    })

    it('returns false if pollId or address missing', async () => {
        const res1 = await isUserWhitelisted(null, '0x')
        const res2 = await isUserWhitelisted('1', null)
        expect(res1.data).toBe(false)
        expect(res2.data).toBe(false)
    })

    it('returns error on contract failure', async () => {
        mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
        const { error } = await isUserWhitelisted('1', '0x')
        expect(error).toContain('Could not check whitelist status')
    })
  })

  describe('isUserRegistered', () => {
    it('returns true if registered in semaphore module', async () => {
        getModules.mockResolvedValueOnce({ 
            eligibilityModule: CONTRACT_ADDRESSES.semaphoreEligibility 
        })
        mockPublicClient.readContract.mockResolvedValueOnce(true)
        const { data } = await isUserRegistered('1', '0xUser')
        expect(data).toBe(true)
    })

    it('returns false if not a semaphore module', async () => {
        getModules.mockResolvedValueOnce({ eligibilityModule: '0xOther' })
        const { data } = await isUserRegistered('1', '0xUser')
        expect(data).toBe(false)
    })

    it('handles contract failure gracefully', async () => {
        getModules.mockResolvedValueOnce({ 
            eligibilityModule: CONTRACT_ADDRESSES.semaphoreEligibility 
        })
        mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
        const { data } = await isUserRegistered('1', '0xUser')
        expect(data).toBe(false)
    })

    it('returns false if params missing', async () => {
        expect((await isUserRegistered(null, '0x')).data).toBe(false)
        expect((await isUserRegistered('1', null)).data).toBe(false)
    })
  })

  describe('whitelistUser', () => {
    it('successfully whitelists a user', async () => {
        await whitelistUser('1', '0xUser')
        expect(writeContract).toHaveBeenCalled()
    })

    it('throws if userAddress missing', async () => {
        await expect(whitelistUser('1', null)).rejects.toThrow('No user to whitelist')
    })

    it('throws if transaction reverts', async () => {
        waitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' })
        await expect(whitelistUser('1', '0x')).rejects.toThrow('Transaction REVERTED on chain')
    })

    it('throws on catch', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(whitelistUser('1', '0x')).rejects.toThrow()
    })
  })

  describe('whitelistUsers', () => {
    it('successfully whitelists multiple users', async () => {
        const res = await whitelistUsers('1', ['0x1', '0x2'])
        expect(res).toBe(true)
    })

    it('throws if users array missing/empty', async () => {
        await expect(whitelistUsers('1', [])).rejects.toThrow('No users to whitelist')
        await expect(whitelistUsers('1', null)).rejects.toThrow('No users to whitelist')
    })

    it('throws if transaction reverts', async () => {
      waitForTransactionReceipt.mockResolvedValueOnce({ status: 0 })
      await expect(whitelistUsers('1', ['0x1'])).rejects.toThrow('Transaction REVERTED on chain')
    })

    it('throws on catch', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(whitelistUsers('1', ['0x'])).rejects.toThrow()
    })
  })

  describe('addMember', () => {
    it('successfully registers identity', async () => {
        const result = await addMember('1', '123')
        expect(result).toBe(true)
    })

    it('throws if wallet not connected', async () => {
        getAccount.mockReturnValueOnce({ address: null })
        await expect(addMember('1', '123')).rejects.toThrow('Wallet not connected')
    })

    it('throws if transaction reverts', async () => {
        waitForTransactionReceipt.mockResolvedValueOnce({ status: 0 })
        await expect(addMember('1', '123')).rejects.toThrow('Transaction REVERTED on chain')
    })

    it('throws on error', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(addMember('1', '123')).rejects.toThrow()
    })
  })

  describe('Helpers & Event Registry', () => {
    it('returns correct MemberAdded signature', () => {
        const { getMemberAddedEventSignature } = require('./members')
        expect(getMemberAddedEventSignature()).toContain('MemberAdded')
    })

    it('parses MemberAdded log accurately', () => {
        const { parseMemberAddedLog } = require('./members')
        const log = {
            args: { identityCommitment: 999n },
            transactionHash: '0xTx',
            blockNumber: 42n
        }
        const parsed = parseMemberAddedLog(log)
        expect(parsed.identityCommitment).toBe('999')
        expect(parsed.transactionHash).toBe('0xTx')
        expect(parsed.blockNumber).toBe(42n)
    })
    
    it('parses MemberAdded log with positional args', () => {
        const { parseMemberAddedLog } = require('./members')
        const log = {
            args: [null, null, 777n],
            transactionHash: '0xTx',
            blockNumber: 42n
        }
        const parsed = parseMemberAddedLog(log)
        expect(parsed.identityCommitment).toBe('777')
    })
  })
})
