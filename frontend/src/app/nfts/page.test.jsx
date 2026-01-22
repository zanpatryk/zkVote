import { render, screen } from '@testing-library/react'
import NFTsPage from './page'

// Mock dependencies
jest.mock('@/components/NFTDashboard', () => {
  return function MockNFTDashboard() {
    return <div data-testid="nft-dashboard">NFT Dashboard Content</div>
  }
})

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>
  }
}))

describe('NFTsPage', () => {
  it('renders the dashboard and title', () => {
    render(<NFTsPage />)
    
    expect(screen.getByText('My NFT Badges')).toBeInTheDocument()
    expect(screen.getByText(/Collection of your/i)).toBeInTheDocument()
    expect(screen.getByTestId('nft-dashboard')).toBeInTheDocument()
  })
})
