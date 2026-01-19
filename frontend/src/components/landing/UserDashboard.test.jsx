
import { render, screen } from '@testing-library/react'
import UserDashboard from './UserDashboard'

// Mock NFTCard
jest.mock('@/components/NFTCard', () => {
  return function MockNFTCard({ nft }) {
    return <div data-testid="nft-card">{nft.name}</div>
  }
})

describe('UserDashboard', () => {
  it('renders loading state', () => {
    render(<UserDashboard loading={true} nfts={[]} />)
    expect(screen.getByText('Loading badges...')).toBeInTheDocument()
  })

  it('renders empty state when no NFTs', () => {
    render(<UserDashboard loading={false} nfts={[]} />)
    expect(screen.getByText(/You haven't earned any badges yet/i)).toBeInTheDocument()
  })

  it('renders grid of NFTs when available', () => {
    const mockNfts = [
      { tokenId: '1', name: 'Badge 1' },
      { tokenId: '2', name: 'Badge 2' }
    ]
    render(<UserDashboard loading={false} nfts={mockNfts} />)
    
    expect(screen.queryByText('Loading badges...')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('nft-card')).toHaveLength(2)
    expect(screen.getByText('Badge 1')).toBeInTheDocument()
    expect(screen.getByText('Badge 2')).toBeInTheDocument()
  })
})
