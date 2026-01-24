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

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount()
}))

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  })
}))

describe('NFTsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the dashboard when connected', () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    render(<NFTsPage />)
    
    expect(screen.getByText('My NFT Badges')).toBeInTheDocument()
    expect(screen.getByText(/Collection of your/i)).toBeInTheDocument()
    expect(screen.getByTestId('nft-dashboard')).toBeInTheDocument()
  })

  it('redirects to home when disconnected', () => {
    mockUseAccount.mockReturnValue({ isConnected: false })
    render(<NFTsPage />)
    
    expect(mockReplace).toHaveBeenCalledWith('/')
    expect(screen.queryByText('My NFT Badges')).not.toBeInTheDocument()
  })
})
