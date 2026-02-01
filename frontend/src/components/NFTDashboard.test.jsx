import { render, screen, waitFor, act } from '@testing-library/react'
import NFTDashboard from './NFTDashboard'
import { useAccount } from 'wagmi'
import { getUserNFTs } from '@/lib/blockchain/engine/read'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useChainId: jest.fn(() => 31337),
  http: jest.fn(),
}))
jest.mock('@/lib/blockchain/engine/read', () => ({
  getUserNFTs: jest.fn(),
}))

describe('NFTDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows empty state when disconnected', () => {
    useAccount.mockReturnValue({ isConnected: false, address: null })
    render(<NFTDashboard />)

    expect(screen.getByText('No Badges Yet')).toBeInTheDocument()
  })

  it('fetches and displays badges when connected', async () => {
    useAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    getUserNFTs.mockResolvedValue({
      data: [
        { tokenId: '1', name: 'Badge 1', description: 'Desc 1', attributes: [] },
        { tokenId: '2', name: 'Badge 2', description: 'Desc 2', attributes: [] }
      ],
      error: null
    })

    await act(async () => {
      render(<NFTDashboard />)
    })

    await waitFor(() => {
      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 2')).toBeInTheDocument()
    })
  })

  it('displays empty state when user has no NFTs', async () => {
    useAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    getUserNFTs.mockResolvedValue({ data: [], error: null })

    await act(async () => {
      render(<NFTDashboard />)
    })

    await waitFor(() => {
      expect(screen.getByText('No Badges Yet')).toBeInTheDocument()
    })
  })

  it('handles fetch errors gracefully', async () => {
    useAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    getUserNFTs.mockResolvedValue({ data: [], error: 'Network Error' })

    await act(async () => {
        render(<NFTDashboard />)
    })

    await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
        expect(screen.getByText(/Could not connect to the network/i)).toBeInTheDocument()
    })
  })
})
