import { render, screen, waitFor } from '@testing-library/react'
import VoteOnPoll from '../src/app/poll/[pollId]/vote/page'
import '@testing-library/jest-dom'
import { useParams, useRouter } from 'next/navigation'
import { useVoteFlow } from '../src/hooks/useVoteFlow'
import React from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('../src/hooks/useVoteFlow', () => ({
  useVoteFlow: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn(), loading: jest.fn() },
}))

jest.mock('@/components/VoteBallot', () => {
  return function MockBallot({ onSubmit, alreadyVoted, poll }) {
    if (alreadyVoted) return <div>Already Voted</div>
    if (poll && poll.state === 0) return <div>This poll has not started yet.</div>
    return (
      <div data-testid="vote-ballot">
        <button onClick={onSubmit}>Cast Vote</button>
      </div>
    )
  }
})

jest.mock('@/components/BackButton', () => {
  return function MockBackButton() {
    return <button>Back</button>
  }
})

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div>, p: 'p' },
  AnimatePresence: ({ children }) => children,
}))

describe('Integration Test: Vote Casting Page', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockPollId = '123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush, replace: mockReplace })
    useParams.mockReturnValue({ pollId: mockPollId })
    
    useVoteFlow.mockReturnValue({
      poll: { title: 'Poll', state: 1, options: ['A', 'B'] },
      pollId: mockPollId,
      alreadyVoted: false,
      voteTxHash: null,
      loadedIdentity: null,
      isLoading: false,
      isSubmitting: false,
      currentStep: 0,
      steps: [],
      error: null,
      handleVoteSubmit: jest.fn()
    })
  })

  it('renders loading state initially', () => {
     useVoteFlow.mockReturnValue({ isLoading: true, pollId: mockPollId })
     render(<VoteOnPoll />)
     expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('shows "This poll has not started yet." if poll is Created (state 0)', async () => {
    useVoteFlow.mockReturnValue({
      poll: { title: 'Poll', state: 0, options: ['A', 'B'] },
      pollId: mockPollId,
      alreadyVoted: false,
      isLoading: false,
      handleVoteSubmit: jest.fn()
    })
    
    render(<VoteOnPoll />)

    await waitFor(() => {
        expect(screen.getByText('This poll has not started yet.')).toBeInTheDocument()
    })
  })

  it('renders voting form if poll is Active (state 1)', async () => {
    useVoteFlow.mockReturnValue({
      poll: { title: 'Poll', state: 1, options: ['A', 'B'] },
      pollId: mockPollId,
      alreadyVoted: false,
      isLoading: false,
      handleVoteSubmit: jest.fn()
    })

    render(<VoteOnPoll />)

    await waitFor(() => {
      expect(screen.getByText('Cast Vote')).toBeInTheDocument()
    })
  })
})
