import { render, screen, waitFor } from '@testing-library/react'
import LandingPage from './page'
import * as read from '@/lib/blockchain/engine/read'
import * as wagmi from 'wagmi'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getUserNFTs: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

// Mock components to avoid viem import issues
jest.mock('@/components/PollCard', () => {
  return function MockPollCard({ title }) {
    return <div data-testid="poll-card">{title}</div>
  }
})

jest.mock('@/components/ReceiptCard', () => {
  return function MockReceiptCard({ pollId }) {
    return <div data-testid="receipt-card">Receipt for {pollId}</div>
  }
})

jest.mock('@/components/NFTCard', () => {
  return function MockNFTCard({ nft }) {
    return (
      <div data-testid="nft-card">
        <span>{nft.name}</span>
        <span>{nft.description}</span>
        {nft.attributes?.map((attr, idx) => (
          <div key={idx}>
            <span>{attr.trait_type}:</span>
            <span>{attr.value}</span>
          </div>
        ))}
      </div>
    )
  }
})

describe('LandingPage', () => {
  const mockUserAddress = '0xUser'

  beforeEach(() => {
    jest.clearAllMocks()
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
  })

  it('renders title', () => {
    read.getUserNFTs.mockResolvedValue([])
    render(<LandingPage />)
    expect(screen.getByText('zkVote')).toBeInTheDocument()
    expect(screen.getByText('Secure, transparent, and verifiable voting on the blockchain.')).toBeInTheDocument()
  })

  it('fetches and displays user badges when connected', async () => {
    const mockNFTs = [
      {
        tokenId: '1',
        name: 'Poll #1 Results',
        description: 'Results for poll: Test Poll',
        attributes: [
          { trait_type: 'Yes', value: '10' },
          { trait_type: 'No', value: '5' }
        ]
      }
    ]
    read.getUserNFTs.mockResolvedValue(mockNFTs)

    render(<LandingPage />)

    expect(screen.getByText('Your Voting Badges')).toBeInTheDocument()
    expect(screen.getByText('Loading badges...')).toBeInTheDocument()

    await waitFor(() => {
      expect(read.getUserNFTs).toHaveBeenCalledWith(mockUserAddress)
      expect(screen.getByText('Poll #1 Results')).toBeInTheDocument()
      expect(screen.getByText('Results for poll: Test Poll')).toBeInTheDocument()
      expect(screen.getByText('Yes:')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('displays empty state when no badges found', async () => {
    read.getUserNFTs.mockResolvedValue([])

    render(<LandingPage />)

    await waitFor(() => {
      expect(screen.getByText("You haven't earned any badges yet. Participate in polls to earn them!")).toBeInTheDocument()
    })
  })

  it('does not fetch badges if not connected', () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    render(<LandingPage />)
    
    expect(read.getUserNFTs).not.toHaveBeenCalled()
    expect(screen.queryByText('Your Voting Badges')).not.toBeInTheDocument()
  })
})
