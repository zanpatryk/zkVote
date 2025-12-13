import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WhitelistPage from './page'
import { whitelistUser, whitelistUsers } from '@/lib/blockchain/engine/write'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { isAddress } from 'viem'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/write', () => ({
  whitelistUser: jest.fn(),
  whitelistUsers: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

jest.mock('viem', () => ({
  isAddress: jest.fn(),
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

// Mock FileReader
class MockFileReader {
  readAsText(file) {
    this.onload({ target: { result: file.content } })
  }
}
global.FileReader = MockFileReader

describe('WhitelistPage', () => {
  const mockPollId = '123'
  const mockRouter = { push: jest.fn() }
  const mockAddress = '0x123'

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId })
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ isConnected: true })
    isAddress.mockReturnValue(true)
  })

  it('renders correctly', () => {
    render(<WhitelistPage />)
    expect(screen.getByText('Whitelist Voters')).toBeInTheDocument()
    expect(screen.getByText('Single Address')).toBeInTheDocument()
    expect(screen.getByText('Batch Upload')).toBeInTheDocument()
  })

  it('handles copy poll ID', () => {
    render(<WhitelistPage />)
    const copyBtn = screen.getByTitle('Copy Poll ID')
    fireEvent.click(copyBtn)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPollId)
    expect(toast.success).toHaveBeenCalledWith('Poll ID copied!')
  })

  it('toggles between single and batch mode', () => {
    render(<WhitelistPage />)
    
    // Default is single
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
    
    // Switch to batch
    fireEvent.click(screen.getByText('Batch Upload'))
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('0x...')).not.toBeInTheDocument()
    
    // Switch back to single
    fireEvent.click(screen.getByText('Single Address'))
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
  })

  describe('Single Address Mode', () => {
    it('validates address format', async () => {
      isAddress.mockReturnValue(false)
      render(<WhitelistPage />)
      
      const input = screen.getByPlaceholderText('0x...')
      fireEvent.change(input, { target: { value: 'invalid-address' } })
      
      const submitBtn = screen.getByText('Whitelist Address')
      fireEvent.click(submitBtn)
      
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid wallet address.')
      expect(whitelistUser).not.toHaveBeenCalled()
    })

    it('requires wallet connection', async () => {
      useAccount.mockReturnValue({ isConnected: false })
      render(<WhitelistPage />)
      
      const submitBtn = screen.getByText('Whitelist Address')
      fireEvent.click(submitBtn)
      
      expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
      expect(whitelistUser).not.toHaveBeenCalled()
    })

    it('submits valid address successfully', async () => {
      render(<WhitelistPage />)
      
      const input = screen.getByPlaceholderText('0x...')
      fireEvent.change(input, { target: { value: mockAddress } })
      
      const submitBtn = screen.getByText('Whitelist Address')
      fireEvent.click(submitBtn)
      
      await waitFor(() => {
        expect(whitelistUser).toHaveBeenCalledWith(mockPollId, mockAddress.toLowerCase())
      })
      expect(input.value).toBe('')
    })

    it('handles submission error', async () => {
      whitelistUser.mockRejectedValue(new Error('Failed'))
      render(<WhitelistPage />)
      
      const input = screen.getByPlaceholderText('0x...')
      fireEvent.change(input, { target: { value: mockAddress } })
      
      const submitBtn = screen.getByText('Whitelist Address')
      fireEvent.click(submitBtn)
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  describe('Batch Upload Mode', () => {
    beforeEach(() => {
      render(<WhitelistPage />)
      fireEvent.click(screen.getByText('Batch Upload'))
    })

    it('handles file upload with valid addresses', async () => {
      const fileContent = '0x123\n0x456, 0x789'
      const file = new File([fileContent], 'addresses.txt', { type: 'text/plain' })
      file.content = fileContent // For MockFileReader

      const input = screen.getByLabelText('Upload File')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Found 3 valid addresses.')
      })
      expect(screen.getByText('Ready to whitelist 3 addresses.')).toBeInTheDocument()
    })

    it('handles file upload with no valid addresses', async () => {
      isAddress.mockReturnValue(false)
      const fileContent = 'invalid'
      const file = new File([fileContent], 'addresses.txt', { type: 'text/plain' })
      file.content = fileContent

      const input = screen.getByLabelText('Upload File')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No valid addresses found in the file.')
      })
    })

    it('submits batch addresses successfully', async () => {
      const fileContent = '0x123'
      const file = new File([fileContent], 'addresses.txt', { type: 'text/plain' })
      file.content = fileContent

      const input = screen.getByLabelText('Upload File')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText('Whitelist 1 Users')).toBeInTheDocument()
      })

      const submitBtn = screen.getByText('Whitelist 1 Users')
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(whitelistUsers).toHaveBeenCalledWith(mockPollId, ['0x123'])
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/poll')
    })
  })
})
