import { isAddress } from 'viem'
import { parseAddressesFromFile, parseJsonFile } from './file'

jest.mock('viem', () => ({
  isAddress: jest.fn()
}))

describe('file utils', () => {
  describe('parseAddressesFromFile', () => {
    it('throws error if no file provided', async () => {
      await expect(parseAddressesFromFile(null)).rejects.toThrow('No file provided')
    })

    it('parses valid unique addresses correctly', async () => {
      const content = '0x123,0x456 0x789\n0x123'
      const mockFile = { text: jest.fn().mockResolvedValue(content) }
      
      isAddress.mockImplementation(addr => addr.startsWith('0x'))
      
      const result = await parseAddressesFromFile(mockFile)
      
      expect(result).toEqual(['0x123', '0x456', '0x789'])
      expect(result.length).toBe(3)
    })

    it('normalizes addresses to lowercase', async () => {
      const content = '0xABC, 0xdef'
      const mockFile = { text: jest.fn().mockResolvedValue(content) }
      
      isAddress.mockReturnValue(true)
      
      const result = await parseAddressesFromFile(mockFile)
      expect(result).toEqual(['0xabc', '0xdef'])
    })

    it('filters out invalid addresses', async () => {
      const content = '0xValid, NOT_VALID'
      const mockFile = { text: jest.fn().mockResolvedValue(content) }
      
      isAddress.mockImplementation(addr => addr === '0xvalid')
      
      const result = await parseAddressesFromFile(mockFile)
      expect(result).toEqual(['0xvalid'])
    })

    it('throws custom error on read failure', async () => {
      const mockFile = { text: jest.fn().mockRejectedValue(new Error('Read error')) }
      await expect(parseAddressesFromFile(mockFile)).rejects.toThrow('Failed to parse file content')
    })
  })

  describe('parseJsonFile', () => {
    it('throws error if no file provided', async () => {
      await expect(parseJsonFile(null)).rejects.toThrow('No file provided')
    })

    it('parses valid JSON', async () => {
      const data = { key: 'value' }
      const mockFile = { text: jest.fn().mockResolvedValue(JSON.stringify(data)) }
      
      const result = await parseJsonFile(mockFile)
      expect(result).toEqual(data)
    })

    it('throws error on invalid JSON', async () => {
      const mockFile = { text: jest.fn().mockResolvedValue('invalid-json') }
      await expect(parseJsonFile(mockFile)).rejects.toThrow('Invalid JSON file')
    })
  })
})
