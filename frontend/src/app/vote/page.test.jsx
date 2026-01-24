import { render, screen } from '@testing-library/react'
import VotePage from './page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x123', isConnected: true })),
}))

jest.mock('@/hooks/usePolls', () => ({
  useWhitelistedPolls: jest.fn(),
}))

jest.mock('@/hooks/usePollFilter', () => ({
  usePollFilter: jest.fn(),
}))

jest.mock('@/components/PollCard', () => ({ pollId, title, state }) => (
  <div data-testid="poll-card">
    {title} - {pollId.toString()} - {state}
  </div>
))

jest.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button' },
  AnimatePresence: ({ children }) => children,
}))

describe('VotePage', () => {
  const { useWhitelistedPolls } = require('@/hooks/usePolls')
  const { usePollFilter } = require('@/hooks/usePollFilter')

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementation
    usePollFilter.mockImplementation((polls) => ({
        searchQuery: '',
        setSearchQuery: jest.fn(),
        statusFilter: 'all',
        setStatusFilter: jest.fn(),
        filteredPolls: polls || [] 
    }))
  })

  it('renders loading state', () => {
    useWhitelistedPolls.mockReturnValue({ isLoading: true, polls: [] })
    render(<VotePage />)
    expect(screen.getByText('Loading polls...')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    useWhitelistedPolls.mockReturnValue({ isLoading: false, polls: [] })
    render(<VotePage />)
    expect(screen.getByText('You are not whitelisted on any poll yet.')).toBeInTheDocument()
  })

  it('renders connection error state', () => {
    useWhitelistedPolls.mockReturnValue({ isLoading: false, polls: [], error: 'Network Error' })
    render(<VotePage />)
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText(/Could not connect to the network/i)).toBeInTheDocument()
  })

  it('renders list of polls', () => {
    const mockPolls = [
      { pollId: 1n, title: 'Poll 1', state: 1, creator: '0x456' },
      { pollId: 2n, title: 'Poll 2', state: 0, creator: '0x123' },
    ]
    useWhitelistedPolls.mockReturnValue({ isLoading: false, polls: mockPolls })
    
    render(<VotePage />)
    
    expect(screen.getByText('Vote on Polls')).toBeInTheDocument()
    expect(screen.getAllByTestId('poll-card')).toHaveLength(2)
    expect(screen.getByText('Poll 1 - 1 - 1')).toBeInTheDocument()
    expect(screen.getByText('Poll 2 - 2 - 0')).toBeInTheDocument()
  })
})
