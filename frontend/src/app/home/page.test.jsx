import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import HomePage from './page'
import * as read from '@/lib/blockchain/engine/read'
import '@testing-library/jest-dom'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ isConnected: true, address: '0x123' })),
}))

// Mock read
jest.mock('@/lib/blockchain/engine/read', () => ({
  getUserNFTs: jest.fn(),
}))

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
  })

  it('renders default check vote tab', () => {
    // Suppress console.error related to act() if needed, but improved logic avoids it
    read.getUserNFTs.mockResolvedValue([])
    render(<HomePage />)
    expect(screen.getByText('Check your vote')).toBeInTheDocument()
    expect(screen.getByText('NFT Badges')).toBeInTheDocument()
  })

  it('switches to NFT badges tab and fetches data', async () => {
    const mockNFTs = [
      {
        tokenId: '1',
        name: 'Poll #1 Badge',
        description: 'You voted!',
        attributes: []
      }
    ]
    read.getUserNFTs.mockResolvedValue(mockNFTs)

    render(<HomePage />)
    
    // Switch to badges tab
    await act(async () => {
      fireEvent.click(screen.getByText('NFT Badges'))
    })



    await waitFor(() => {
      expect(screen.getByText('Poll #1 Badge')).toBeInTheDocument()
      expect(screen.getByText('You voted!')).toBeInTheDocument()
    })
  })

  it('displays empty state when no badges found in tab', async () => {
    read.getUserNFTs.mockResolvedValue([])
    
    render(<HomePage />)
    
    await act(async () => {
      fireEvent.click(screen.getByText('NFT Badges'))
    })

    await waitFor(() => {
      expect(screen.getByText('No Badges Yet')).toBeInTheDocument()
      expect(screen.getByText(/Participate/)).toBeInTheDocument()
    })
  })

  it('handles file upload and redirects on success', async () => {
    read.getUserNFTs.mockResolvedValue([])
    render(<HomePage />)
    
    const fileContent = 'Poll ID: 123\nVote ID: 456'
    const file = new File([fileContent], 'receipt.txt', { type: 'text/plain' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    
    const input = screen.getByLabelText('Upload vote receipt')
    await act(async () => {
       fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/poll/123/vote/check/456')
    })
  })

  it('alerts on invalid file content', async () => {
    read.getUserNFTs.mockResolvedValue([])
    render(<HomePage />)
    
    const fileContent = 'Invalid content'
    const file = new File([fileContent], 'receipt.txt', { type: 'text/plain' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    
    const input = screen.getByLabelText('Upload vote receipt')
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Could not read poll and vote IDs from this receipt file.')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
