import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  http: jest.fn(),
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

  it('renders both sections', () => {
    read.getUserNFTs.mockResolvedValue([])
    render(<HomePage />)
    expect(screen.getByPlaceholderText('Search by Poll ID...')).toBeInTheDocument()
  })

  it('fetches and displays badges on mount', async () => {
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
    
    // Should happen automatically without tab switching
    await waitFor(() => {
      expect(screen.getByText('Poll #1 Badge')).toBeInTheDocument()
      expect(screen.getByText('You voted!')).toBeInTheDocument()
    })
  })

  it('displays empty state when no badges found', async () => {
    read.getUserNFTs.mockResolvedValue([])
    
    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('No Badges Yet')).toBeInTheDocument()
      expect(screen.getByText(/Participate/)).toBeInTheDocument()
    })
  })
})
