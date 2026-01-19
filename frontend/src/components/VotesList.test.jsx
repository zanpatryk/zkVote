import { render, screen, waitFor } from '@testing-library/react'
import VotesList from './VotesList'
import { usePollVotes } from '@/hooks/usePollVotes'

// Mock the hook
jest.mock('@/hooks/usePollVotes', () => ({
  usePollVotes: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('VotesList', () => {
  const mockPollId = '123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    usePollVotes.mockReturnValue({ // Default state
        votes: [],
        loading: false
    })
  })

  it('renders loading state', () => {
    usePollVotes.mockReturnValue({ votes: [], loading: true })
    render(<VotesList pollId={mockPollId} />)
    
    // Check for loading spinner or missing table
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders empty state when no votes fetched', () => {
    usePollVotes.mockReturnValue({ votes: [], loading: false })
    render(<VotesList pollId={mockPollId} />)
    
    expect(screen.getByText('Cast Votes (0)')).toBeInTheDocument()
    expect(screen.getByText('No votes recorded yet.')).toBeInTheDocument()
  })

  it('renders votes list when votes are fetched', () => {
    const mockVotes = [
      { voter: '0x123', voteId: '1', transactionHash: '0xabc', blockNumber: 100n },
      { voter: '0x456', voteId: '2', transactionHash: '0xdef', blockNumber: 101n },
    ]
    usePollVotes.mockReturnValue({ votes: mockVotes, loading: false })

    render(<VotesList pollId={mockPollId} />)

    expect(screen.getByText('Cast Votes (2)')).toBeInTheDocument()
    expect(screen.getByText('0x123')).toBeInTheDocument()
    expect(screen.getByText('0x456')).toBeInTheDocument()
  })
})
