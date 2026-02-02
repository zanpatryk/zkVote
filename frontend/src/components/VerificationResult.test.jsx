import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VerificationResult from './VerificationResult'
import { useRouter } from 'next/navigation'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'
import '@testing-library/jest-dom'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getVote: jest.fn(),
  getPollById: jest.fn(),
}))

jest.mock('@/lib/utils/explorer', () => ({
  getExplorerTxUrl: (hash) => `https://explorer.com/tx/${hash}`,
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

describe('VerificationResult', () => {
  const mockRouter = { push: jest.fn() }
  const mockOnReset = jest.fn()
  const defaultProps = {
    pollId: '123',
    voteId: '456',
    txHash: '0xHash',
    nullifier: '123456789',
    proof: 'proof-data',
    onReset: mockOnReset,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
  })

  it('renders loading state initially', () => {
    getVote.mockImplementation(() => new Promise(() => {}))
    getPollById.mockImplementation(() => new Promise(() => {}))
    render(<VerificationResult {...defaultProps} />)
    expect(screen.getByText('Verifying on-chain...')).toBeInTheDocument()
  })

  it('renders error state when vote not found', async () => {
    getVote.mockResolvedValue({ data: null, error: 'Vote not found' })
    getPollById.mockResolvedValue({ data: { id: '123', title: 'Test Poll' }, error: null })
    
    render(<VerificationResult {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Vote not found or could not be loaded.')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Try another receipt'))
    expect(mockOnReset).toHaveBeenCalled()
  })

  it('renders successful verification details', async () => {
    getVote.mockResolvedValue({
      data: {
        pollId: '123',
        voteId: '456',
        optionIdx: 0,
        voter: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Address for mock nullifier
        timestamp: 1672531200
      },
      error: null
    })
    getPollById.mockResolvedValue({
      data: {
        id: '123',
        title: 'Test Poll',
        options: ['Option A', 'Option B'],
        state: 1, // Active
        creator: '0xCreator'
      },
      error: null
    })

    render(<VerificationResult {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Poll Title')).toBeInTheDocument()
      expect(screen.getByText('Option A')).toBeInTheDocument()
      expect(screen.getByText('0xHash')).toBeInTheDocument()
    })
  })

  it('handles encrypted votes (null option text)', async () => {
    getVote.mockResolvedValue({
      data: {
        pollId: '123',
        voteId: '456',
        optionIdx: null,
        voter: '0xVoter'
      },
      error: null
    })
    getPollById.mockResolvedValue({
      data: {
        id: '123',
        title: 'Encrypted Poll',
        state: 1
      },
      error: null
    })

    render(<VerificationResult {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Encrypted Vote')).toBeInTheDocument()
    })
  })

  it('navigates to poll page on button click when active', async () => {
    getVote.mockResolvedValue({ data: { pollId: '123', voteId: '456', optionIdx: 0 }, error: null })
    getPollById.mockResolvedValue({ data: { id: '123', state: 1 }, error: null })

    render(<VerificationResult {...defaultProps} />)

    await waitFor(() => {
      const btn = screen.getByText('View Active Poll')
      fireEvent.click(btn)
      expect(mockRouter.push).toHaveBeenCalledWith('/poll/123')
    })
  })

  it('navigates to NFT page on button click when ended', async () => {
     getVote.mockResolvedValue({ data: { pollId: '123', voteId: '456', optionIdx: 0 }, error: null })
     getPollById.mockResolvedValue({ data: { id: '123', state: 2 }, error: null })

     render(<VerificationResult {...defaultProps} />)

     await waitFor(() => {
       const btn = screen.getByText('View Results & Mint NFT')
       fireEvent.click(btn)
       expect(mockRouter.push).toHaveBeenCalledWith('/poll/123/nft')
     })
  })

  it('triggers onReset on "Verify Another Receipt" click', async () => {
    getVote.mockResolvedValue({ data: { pollId: '123', voteId: '456', optionIdx: 0 }, error: null })
    getPollById.mockResolvedValue({ data: { id: '123', state: 1 }, error: null })

    render(<VerificationResult {...defaultProps} />)

    await waitFor(() => {
      fireEvent.click(screen.getByText('Verify Another Receipt'))
      expect(mockOnReset).toHaveBeenCalled()
    })
  })
})
