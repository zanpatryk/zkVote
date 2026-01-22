import { render, screen, waitFor } from '@testing-library/react'
import NFTsPage from '../src/app/nfts/page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: jest.fn(),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  http: jest.fn(),
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
        p: ({ children, className }) => <p className={className}>{children}</p>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock NFTCard component to simplify tree
jest.mock('../src/components/NFTCard', () => ({ nft }) => <div data-testid="nft-card">{nft.name}</div>)

describe('Integration Test: NFT Dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseAccount.mockReturnValue({ isConnected: true, address: '0xUser' })
    })

    it('renders dashboard title', async () => {
        mockGetUserNFTs.mockResolvedValue([])
        render(<NFTsPage />)
        expect(screen.getByText('My NFT Badges')).toBeInTheDocument()
    })

    it('displays empty state when no NFTs found', async () => {
        mockGetUserNFTs.mockResolvedValue([])
        render(<NFTsPage />)

        expect(screen.getByText('My NFT Badges')).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.getByText('No Badges Yet')).toBeInTheDocument()
        })
    })

    it('displays NFT cards when NFTs exist', async () => {
        const mockNFTs = [
            { tokenId: '1', name: 'Poll #1 Results', description: 'Results for poll 1' },
            { tokenId: '2', name: 'Poll #2 Results', description: 'Results for poll 2' }
        ]
        mockGetUserNFTs.mockResolvedValue(mockNFTs)

        render(<NFTsPage />)

        await waitFor(() => {
            expect(screen.getAllByTestId('nft-card')).toHaveLength(2)
        })
        expect(screen.getByText('Poll #1 Results')).toBeInTheDocument()
        expect(screen.getByText('Poll #2 Results')).toBeInTheDocument()
    })

    it('handles loading state', async () => {
        // Delay resolution
        mockGetUserNFTs.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)))
        
        render(<NFTsPage />)
        
        expect(screen.getByText('Loading badges...')).toBeInTheDocument()
        
        await waitFor(() => {
            expect(screen.queryByText('Loading badges...')).not.toBeInTheDocument()
        })
    })
})
