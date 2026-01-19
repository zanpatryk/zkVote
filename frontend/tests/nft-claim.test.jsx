import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MintNFTPage from '../src/app/poll/[pollId]/nft/page'
import '@testing-library/jest-dom'
import { POLL_STATE } from '../src/lib/constants'

// Mock dependencies
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRouter = { push: mockPush, replace: mockReplace }
const mockParams = { pollId: '100' }

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => mockParams,
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock blockchain read/write
const mockGetPollById = jest.fn()
const mockIsUserWhitelisted = jest.fn()
const mockGetUserNFTs = jest.fn()
const mockGetZKPollState = jest.fn()
const mockMintResultNFT = jest.fn()

jest.mock('../src/lib/blockchain/engine/read', () => ({
  getPollById: (...args) => mockGetPollById(...args),
  isUserWhitelisted: (...args) => mockIsUserWhitelisted(...args),
  getUserNFTs: (...args) => mockGetUserNFTs(...args),
  getZKPollState: (...args) => mockGetZKPollState(...args),
}))

jest.mock('../src/lib/blockchain/engine/write', () => ({
    mintResultNFT: (...args) => mockMintResultNFT(...args),
}))

// Mock toast
const mockToastError = jest.fn()
jest.mock('react-hot-toast', () => ({
  toast: { error: (...args) => mockToastError(...args), success: jest.fn() },
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }) => <div className={className}>{children}</div>,
        button: ({ children, onClick, disabled, className }) => (
            <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
        )
    },
}))

// Mock Subcomponents
jest.mock('../src/components/PollDetails', () => () => <div data-testid="poll-details">Poll Details Rendered</div>)
jest.mock('../src/components/BackButton', () => () => <button>Back</button>)

describe('Integration Test: NFT Claim Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseAccount.mockReturnValue({ isConnected: true, address: '0xUser' })
        // Default: Poll exists, Ended, User not minted yet
        mockGetPollById.mockResolvedValue({
            creator: '0xCreator',
            state: POLL_STATE.ENDED
        })
        mockGetUserNFTs.mockResolvedValue([])
        mockGetZKPollState.mockResolvedValue(null) // Not ZK by default
        mockIsUserWhitelisted.mockResolvedValue(true) // Eligible
    })

    it('renders access denied if disconnected', async () => {
        mockUseAccount.mockReturnValue({ isConnected: false })
        render(<MintNFTPage />)
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })

    it('redirects if poll is not ended', async () => {
        mockGetPollById.mockResolvedValue({
            creator: '0xCreator',
            state: POLL_STATE.ACTIVE // Not ended
        })

        render(<MintNFTPage />)
        
        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('not ended'))
            expect(mockReplace).toHaveBeenCalledWith('/poll/100')
        })
    })

    it('redirects if ZK poll results not published', async () => {
        mockGetPollById.mockResolvedValue({ creator: '0xCreator', state: POLL_STATE.ENDED })
        mockGetZKPollState.mockResolvedValue({ resultsPublished: false })

        render(<MintNFTPage />)
        
        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('Tally Results Not Yet Published'))
            expect(mockReplace).toHaveBeenCalledWith('/poll/100')
        })
    })

    it('renders unauthorized if user is not eligible', async () => {
        mockGetPollById.mockResolvedValue({ creator: '0xCreator', state: POLL_STATE.ENDED })
        mockIsUserWhitelisted.mockResolvedValue(false)
        // Ensure user is not creator
        mockUseAccount.mockReturnValue({ isConnected: true, address: '0xStranger' })

        render(<MintNFTPage />)

        await waitFor(() => {
            expect(screen.getByText('Not Authorized')).toBeInTheDocument()
        })
    })

    it('renders mint button if user is eligible', async () => {
        mockGetPollById.mockResolvedValue({ creator: '0xCreator', state: POLL_STATE.ENDED })
        mockIsUserWhitelisted.mockResolvedValue(true)
        
        render(<MintNFTPage />)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
        })
    })

    it('calls mint function on click', async () => {
        mockGetPollById.mockResolvedValue({ creator: '0xCreator', state: POLL_STATE.ENDED })
        mockIsUserWhitelisted.mockResolvedValue(true)
        mockMintResultNFT.mockResolvedValue({ hash: '0x123' })
        
        render(<MintNFTPage />)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Mint Result NFT' }))
        
        expect(mockMintResultNFT).toHaveBeenCalledWith('100')
        // Should transition to success state
        await waitFor(() => {
            expect(screen.getByText('NFT Badge Minted Successfully')).toBeInTheDocument()
        })
    })

    it('shows already minted state if user owns the NFT', async () => {
        mockGetPollById.mockResolvedValue({ creator: '0xCreator', state: POLL_STATE.ENDED })
        mockIsUserWhitelisted.mockResolvedValue(true)
        // User already has this NFT
        mockGetUserNFTs.mockResolvedValue([{ name: 'Poll #100 Results' }])

        render(<MintNFTPage />)

        await waitFor(() => {
            expect(screen.getByText('NFT Badge Minted Successfully')).toBeInTheDocument()
            expect(screen.queryByRole('button', { name: 'Mint Result NFT' })).not.toBeInTheDocument()
        })
    })
})
