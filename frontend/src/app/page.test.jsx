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
  http: jest.fn(),
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

jest.mock('@/components/VoteBallot', () => {
  return function MockVoteBallot({ poll }) {
    return <div data-testid="vote-ballot">{poll?.title || 'Ballot'}</div>
  }
})

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('@/components/landing/HeroSection', () => () => <div>zkVote Hero</div>)
jest.mock('@/components/landing/StatsBanner', () => () => <div>Stats Banner</div>)
jest.mock('@/components/landing/ExperienceShowcase', () => () => <div>Experience</div>)
jest.mock('@/components/landing/HowItWorks', () => () => <div>How It Works</div>)
jest.mock('@/components/landing/CTASection', () => () => <div>CTA</div>)

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('LandingPage', () => {
  const mockUserAddress = '0xUser'
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    require('next/navigation').useRouter.mockReturnValue({ push: mockPush })
  })

  it('renders title when not connected', () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    read.getUserNFTs.mockResolvedValue([])
    render(<LandingPage />)
    // Expect HeroSection content (Mocked)
    expect(screen.getByText('zkVote Hero')).toBeInTheDocument()
  })

  it('redirects when connected', () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true })
    render(<LandingPage />)
    expect(mockPush).toHaveBeenCalledWith('/nfts')
  })
})
