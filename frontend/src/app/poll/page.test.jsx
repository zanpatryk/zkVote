import { render, screen, waitFor } from '@testing-library/react'
import PollsPage from './page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x123', isConnected: true })),
}))

jest.mock('@/hooks/usePolls', () => ({
  useOwnedPolls: jest.fn(),
}))

jest.mock('@/hooks/usePollFilter', () => ({
  usePollFilter: jest.fn(),
}))

jest.mock('@/components/PollCard', () => ({ pollId, title, state, showVoteButton }) => (
  <div data-testid="poll-card">
    {title} - {pollId.toString()} - {state} - VoteButton: {showVoteButton ? 'Yes' : 'No'}
  </div>
))

jest.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))

describe('PollsPage', () => {
  const { useOwnedPolls } = require('@/hooks/usePolls')
  const { usePollFilter } = require('@/hooks/usePollFilter')
  const { useAccount } = require('wagmi')

  beforeEach(() => {
    jest.clearAllMocks()
    usePollFilter.mockImplementation((polls) => ({
        searchQuery: '',
        setSearchQuery: jest.fn(),
        statusFilter: 'all',
        setStatusFilter: jest.fn(),
        filteredPolls: polls || [] 
    }))
  })

  it('renders loading state initially', () => {
    useOwnedPolls.mockReturnValue({ isLoading: true, polls: [] })
    render(<PollsPage />)
    expect(screen.getByText('Loading your polls...')).toBeInTheDocument()
  })

  it('renders empty state when no polls found', () => {
    useOwnedPolls.mockReturnValue({ isLoading: false, polls: [] })
    render(<PollsPage />)
    
    expect(screen.getByText("You haven't created any polls yet.")).toBeInTheDocument()
  })

  it('renders list of owned polls with whitelist status', () => {
    const mockPolls = [
      { pollId: 1n, title: 'Poll 1', state: 1, isWhitelisted: true },
      { pollId: 2n, title: 'Poll 2', state: 0, isWhitelisted: true },
    ]
    useOwnedPolls.mockReturnValue({ isLoading: false, polls: mockPolls })

    render(<PollsPage />)

    expect(screen.getAllByTestId('poll-card')).toHaveLength(2)
    expect(screen.getByText('Poll 1 - 1 - 1 - VoteButton: Yes')).toBeInTheDocument()
    expect(screen.getByText('Poll 2 - 2 - 0 - VoteButton: Yes')).toBeInTheDocument()
  })

  it('handles disconnected state', () => {
    useAccount.mockReturnValue({ isConnected: false })
    // If not connected, useOwnedPolls likely returns empty or handled by enabled flag
    useOwnedPolls.mockReturnValue({ isLoading: false, polls: [] })
    
    render(<PollsPage />)
    
    expect(screen.getByText("You haven't created any polls yet.")).toBeInTheDocument()
  })
})
