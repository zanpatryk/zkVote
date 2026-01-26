import { render, screen, waitFor } from '@testing-library/react'
import LandingPage from '../src/app/page'
import '@testing-library/jest-dom'

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  http: jest.fn(),
}))

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}))

// Mock blockchain read
const mockGetUserNFTs = jest.fn()
jest.mock('../src/lib/blockchain/engine/read', () => ({
  getUserNFTs: (...args) => mockGetUserNFTs(...args),
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }) => <div className={className}>{children}</div>,
    },
}))

// Mock sub-components/landing
jest.mock('../src/components/landing/HeroSection', () => () => <div data-testid="hero">zkVote</div>)
jest.mock('../src/components/landing/StatsBanner', () => () => <div>Stats</div>)
jest.mock('../src/components/landing/ExperienceShowcase', () => () => <div>Experience</div>)
jest.mock('../src/components/landing/HowItWorks', () => () => <div>HowItWorks</div>)
jest.mock('../src/components/landing/CTASection', () => () => (
    <div>
        <h2>Ready to Vote?</h2>
        <div>Connect Wallet Above ↑</div>
    </div>
))

describe('Integration Test: Landing Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders all public sections when disconnected', async () => {
        mockUseAccount.mockReturnValue({ isConnected: false })
        render(<LandingPage />)

        // Hero
        expect(screen.getByTestId('hero')).toHaveTextContent('zkVote')

        // CTA Section
        expect(screen.getByText('Ready to Vote?')).toBeInTheDocument()
        expect(screen.getByText('Connect Wallet Above ↑')).toBeInTheDocument()
    })

})
