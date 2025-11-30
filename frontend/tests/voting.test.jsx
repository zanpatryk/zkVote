import { render, screen, waitFor } from '@testing-library/react'
import VotePage from '../src/app/vote/page'
import '@testing-library/jest-dom'

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock React Query
const mockUseQuery = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options) => mockUseQuery(options),
}))

// Mock blockchain read function
jest.mock('../src/lib/blockchain/engine/read', () => ({
  getWhitelistedPolls: jest.fn(),
}))

// Mock PollCard to avoid complexity of nested components
jest.mock('../src/components/PollCard', () => {
  return function MockPollCard({ title, showVoteButton }) {
    return (
      <div data-testid="poll-card">
        <h2>{title}</h2>
        {showVoteButton && <button>Vote →</button>}
      </div>
    )
  }
})

describe('Integration Test: Voting Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    mockUseQuery.mockReturnValue({ data: [], isLoading: true })

    render(<VotePage />)

    expect(screen.getByText('Loading polls...')).toBeInTheDocument()
  })

  it('shows empty state if no whitelisted polls', () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    render(<VotePage />)

    expect(screen.getByText('You are not whitelisted on any poll yet')).toBeInTheDocument()
  })

  it('renders whitelisted polls', () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    
    const mockPolls = [
      { pollId: 1n, title: 'Poll 1', state: 1, creator: '0x456' },
      { pollId: 2n, title: 'Poll 2', state: 1, creator: '0x789' },
    ]

    mockUseQuery.mockReturnValue({ data: mockPolls, isLoading: false })

    render(<VotePage />)

    expect(screen.getByText('Poll 1')).toBeInTheDocument()
    expect(screen.getByText('Poll 2')).toBeInTheDocument()
    
    const voteButtons = screen.getAllByText('Vote →')
    expect(voteButtons).toHaveLength(2)
  })

  it('handles disconnected state', () => {
    // If disconnected, useAccount returns undefined address
    mockUseAccount.mockReturnValue({ isConnected: false, address: undefined })
    
    // useQuery should be disabled, returning empty data
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    render(<VotePage />)

    // Should show empty state or handle gracefully
    // Based on code: enabled: isConnected && !!address
    // So data will be []
    expect(screen.getByText('You are not whitelisted on any poll yet')).toBeInTheDocument()
  })
})
