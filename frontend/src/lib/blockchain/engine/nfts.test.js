import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { getUserNFTs, mintResultNFT } from './nfts'

jest.mock('@/lib/contracts', () => ({
  votingSystemContract: { abi: [], address: '0xVSE' },
  ResultNFTABI: [],
  getAddresses: jest.fn(() => ({
    vse: '0xVSE',
    startBlock: 0
  }))
}))
jest.mock('@wagmi/core', () => ({
  getPublicClient: jest.fn(),
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
  getAccount: jest.fn(),
}))

jest.mock('viem', () => {
    const actual = jest.requireActual('viem')
    return {
        ...actual,
        parseAbiItem: jest.fn(i => i),
    }
})

describe('nfts domain engine', () => {
  let mockPublicClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockPublicClient = {
      readContract: jest.fn(),
      getLogs: jest.fn(),
      chain: { id: 31337 },
    }
    getPublicClient.mockReturnValue(mockPublicClient)
    getAccount.mockReturnValue({ address: '0xUser' })
    writeContract.mockResolvedValue('0xHash')
    waitForTransactionReceipt.mockResolvedValue({ status: 1 })
  })

  describe('getUserNFTs', () => {
    it('returns empty if userAddress missing', async () => {
      const { data } = await getUserNFTs(null)
      expect(data).toHaveLength(0)
    })

    it('handles empty metadata part', async () => {
        mockPublicClient.readContract.mockResolvedValueOnce('0xNFT') // resultNFT address
        mockPublicClient.getLogs.mockResolvedValue([{ args: { tokenId: 1n } }])
        mockPublicClient.readContract.mockResolvedValueOnce('data:application/json;base64,') // empty json part
        
        const { data } = await getUserNFTs('0xUser')
        expect(data[0].description).toBe('No Metadata')
    })

    it('returns error object when json parsing fails', async () => {
        mockPublicClient.readContract.mockResolvedValueOnce('0xNFT') 
        mockPublicClient.getLogs.mockResolvedValue([{ args: { tokenId: 2n } }])
        mockPublicClient.readContract.mockResolvedValueOnce('data:application/json;base64,INVALID') // invalid base64
        
        const { data } = await getUserNFTs('0xUser')
        expect(data[0].error).toBe(true)
    })

    it('returns error on main contract failure', async () => {
        mockPublicClient.readContract.mockRejectedValue(new Error('fail'))
        const { error } = await getUserNFTs('0x')
        expect(error).toContain('Could not connect to blockchain')
    })
  })

  describe('mintResultNFT', () => {
    it('successfully mints', async () => {
        await mintResultNFT('1')
        expect(writeContract).toHaveBeenCalled()
    })

    it('throws on error', async () => {
        writeContract.mockRejectedValue(new Error('fail'))
        await expect(mintResultNFT('1')).rejects.toThrow()
    })
  })
})
