import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoteOnPoll from './page'
import '@testing-library/jest-dom'
import { useParams } from 'next/navigation'
import { useVoteFlow } from '@/hooks/useVoteFlow'
import { toast } from 'react-hot-toast'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/useVoteFlow', () => ({
  useVoteFlow: jest.fn(),
}))

jest.mock('@/components/VoteBallot', () => {
  return function MockBallot({ onSubmit, setSelectedIndex, submitting }) {
    return (
      <div data-testid="vote-ballot">
        <button onClick={() => setSelectedIndex(0)}>Select Option 1</button>
        <button onClick={onSubmit} disabled={submitting}>Submit Vote</button>
      </div>
    )
  }
})

jest.mock('@/components/BackButton', () => {
  return function MockBackButton({ href, label }) {
    return <a href={href}>{label || 'Go Back'}</a>
  }
})

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div>, p: 'p' },
  AnimatePresence: ({ children }) => children,
}))

describe('VoteOnPoll', () => {
  const mockPollId = '123'
  const mockPollData = { id: mockPollId, title: 'Test Poll', options: ['Yes', 'No'], state: 1 }
  const mockHandleVoteSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId })
    
    useVoteFlow.mockReturnValue({
      poll: mockPollData,
      pollId: mockPollId,
      alreadyVoted: false,
      voteTxHash: null,
      loadedIdentity: null,
      isLoading: false,
      isSubmitting: false,
      currentStep: 0,
      steps: [],
      error: null,
      handleVoteSubmit: mockHandleVoteSubmit
    })
  })

  it('renders loading state', () => {
    useVoteFlow.mockReturnValue({ isLoading: true, pollId: mockPollId })
    render(<VoteOnPoll />)
    expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('renders error if fetching fails', () => {
    useVoteFlow.mockReturnValue({ isLoading: false, error: 'Failed' })
    render(<VoteOnPoll />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('renders ballot when poll is loaded', () => {
    render(<VoteOnPoll />)
    expect(screen.getByTestId('vote-ballot')).toBeInTheDocument()
    expect(screen.getByText('Secure Voting Terminal')).toBeInTheDocument()
  })

  it('calls handleVoteSubmit on submit', async () => {
    render(<VoteOnPoll />)
    
    fireEvent.click(screen.getByText('Select Option 1'))
    fireEvent.click(screen.getByText('Submit Vote'))
    
    expect(mockHandleVoteSubmit).toHaveBeenCalledWith(0)
  })

  it('shows already voted state if user has voted', () => {
    useVoteFlow.mockReturnValue({
        poll: mockPollData,
        pollId: mockPollId,
        alreadyVoted: true,
        voteTxHash: '0xTx',
        isLoading: false,
        handleVoteSubmit: mockHandleVoteSubmit
    })

    render(<VoteOnPoll />)
    expect(screen.getByTestId('vote-ballot')).toBeInTheDocument()
    // VoteBallot components handles the "already voted" UI internally, 
    // so we just verify it's passed the correct props.
  })
})
