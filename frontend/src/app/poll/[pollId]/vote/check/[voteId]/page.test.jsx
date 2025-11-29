import { render, screen, waitFor } from '@testing-library/react'
import VoteCheckPage from './page'
import { getVote, getPollById } from '@/lib/blockchain/engine/read'
import { useParams } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getVote: jest.fn(),
  getPollById: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId, voteId: mockVoteId })
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
    expect(screen.getByText('Option B')).toBeInTheDocument() // Index 1
    
    // Check timestamp rendering (locale dependent, so checking partial match or existence)
    expect(screen.getByText('Timestamp')).toBeInTheDocument()
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
