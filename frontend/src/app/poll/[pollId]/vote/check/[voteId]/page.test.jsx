import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import VoteCheckPage from './page'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getVote: jest.fn(),
  getPollById: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}))

describe('VoteCheckPage', () => {
  const mockPollId = '123'
  const mockVoteId = '456'
  const mockVoteData = {
    optionIdx: 1,
    timestamp: '1678886400', // 2023-03-15T16:00:00.000Z
  }
  const mockPollData = {
    options: ['Option A', 'Option B', 'Option C'],
  }

  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId, voteId: mockVoteId })
    useSearchParams.mockReturnValue({ get: jest.fn() })
    useRouter.mockReturnValue({ push: mockPush })
  })

  it('renders loading state initially', () => {
    getVote.mockReturnValue(new Promise(() => {}))
    render(<VoteCheckPage />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('renders vote details when data is loaded', async () => {
    getVote.mockResolvedValue(mockVoteData)
    getPollById.mockResolvedValue(mockPollData)

    render(<VoteCheckPage />)

    await waitFor(() => {
      expect(screen.getByText('Vote Details')).toBeInTheDocument()
    })

    expect(await screen.findByText(mockPollId)).toBeInTheDocument()
    expect(await screen.findByText(mockVoteId)).toBeInTheDocument()
    
    // Check Poll ID Link
    const pollLink = screen.getByRole('link', { name: mockPollId })
    expect(pollLink).toBeInTheDocument()
    expect(pollLink).toHaveAttribute('href', `/poll/${mockPollId}`)

    expect(screen.getByText('Option B')).toBeInTheDocument() // Index 1
    
    // Check timestamp rendering (locale dependent, so checking partial match or existence)
    expect(screen.getByText('Timestamp')).toBeInTheDocument()
  })

  it('renders transaction hash link when present', async () => {
    getVote.mockResolvedValue(mockVoteData)
    getPollById.mockResolvedValue(mockPollData)
    useSearchParams.mockReturnValue({ get: (key) => key === 'txHash' ? '0x123abc' : null })

    render(<VoteCheckPage />)
    
    await waitFor(() => {
        expect(screen.getByText('Transaction Hash')).toBeInTheDocument()
    })
    
    const txLink = screen.getByRole('link', { name: '0x123abc' })
    expect(txLink).toHaveAttribute('href', 'https://sepolia.etherscan.io/tx/0x123abc')
  })

  it('renders "View Active Poll" button when poll is active', async () => {
    getVote.mockResolvedValue(mockVoteData)
    getPollById.mockResolvedValue({ ...mockPollData, state: 1 })

    render(<VoteCheckPage />)
    
    await waitFor(() => {
        expect(screen.getByText('View Active Poll')).toBeInTheDocument()
    })
    
    const activeBtn = screen.getByText('View Active Poll')
    fireEvent.click(activeBtn)
    expect(mockPush).toHaveBeenCalledWith(`/poll/${mockPollId}`)
  })

  it('renders "View Results & Mint NFT" button when poll is ended', async () => {
    getVote.mockResolvedValue(mockVoteData)
    getPollById.mockResolvedValue({ ...mockPollData, state: 2 })

    render(<VoteCheckPage />)
    
    await waitFor(() => {
        expect(screen.getByText('View Results & Mint NFT')).toBeInTheDocument()
    })

    const endedBtn = screen.getByText('View Results & Mint NFT')
    fireEvent.click(endedBtn)
    expect(mockPush).toHaveBeenCalledWith(`/poll/${mockPollId}/nft`)
  })

  it('renders error when vote is not found', async () => {
    getVote.mockResolvedValue(null)
    getPollById.mockResolvedValue(mockPollData)

    render(<VoteCheckPage />)

    await waitFor(() => {
      expect(screen.getByText('Vote not found or could not be loaded.')).toBeInTheDocument()
    })
  })

  it('renders error when fetch fails', async () => {
    getVote.mockRejectedValue(new Error('Fetch error'))
    
    render(<VoteCheckPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load details.')).toBeInTheDocument()
    })
  })

  it('handles unknown option index', async () => {
    const voteWithInvalidIndex = { ...mockVoteData, optionIdx: 99 }
    getVote.mockResolvedValue(voteWithInvalidIndex)
    getPollById.mockResolvedValue(mockPollData)

    render(<VoteCheckPage />)

    await waitFor(() => {
      expect(screen.getByText('Unknown Option')).toBeInTheDocument()
    })
  })
})
