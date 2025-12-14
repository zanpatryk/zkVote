import { render, screen } from '@testing-library/react'
import VotePage from './page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x123', isConnected: true })),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getWhitelistedPolls: jest.fn(),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

jest.mock('@/components/PollCard', () => ({ pollId, title, state }) => (
  <div data-testid="poll-card">
    {title} - {pollId.toString()} - {state}
  </div>
))

describe('VotePage', () => {
  const { useQuery } = require('@tanstack/react-query')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    useQuery.mockReturnValue({ isLoading: true, data: undefined })
    render(<VotePage />)
    expect(screen.getByText('Loading polls...')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    useQuery.mockReturnValue({ isLoading: false, data: [] })
    render(<VotePage />)
    expect(screen.getByText('You are not whitelisted on any poll yet.')).toBeInTheDocument()
  })

  it('renders list of polls', () => {
    const mockPolls = [
      { pollId: 1n, title: 'Poll 1', state: 1, creator: '0x456' },
      { pollId: 2n, title: 'Poll 2', state: 0, creator: '0x123' },
    ]
    useQuery.mockReturnValue({ isLoading: false, data: mockPolls })
    
    render(<VotePage />)
    
    expect(screen.getByText('Vote on Polls')).toBeInTheDocument()
    expect(screen.getAllByTestId('poll-card')).toHaveLength(2)
    expect(screen.getByText('Poll 1 - 1 - 1')).toBeInTheDocument()
    expect(screen.getByText('Poll 2 - 2 - 0')).toBeInTheDocument()
  })
})
