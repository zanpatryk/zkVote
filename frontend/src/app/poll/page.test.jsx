import { render, screen, waitFor } from '@testing-library/react'
import PollsPage from './page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x123', isConnected: true })),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getOwnedPolls: jest.fn(),
  isUserWhitelisted: jest.fn(),
}))

jest.mock('@/components/PollCard', () => ({ pollId, title, state, showVoteButton }) => (
  <div data-testid="poll-card">
    {title} - {pollId.toString()} - {state} - VoteButton: {showVoteButton ? 'Yes' : 'No'}
  </div>
))

describe('PollsPage', () => {
  const { getOwnedPolls, isUserWhitelisted } = require('@/lib/blockchain/engine/read')
  const { useAccount } = require('wagmi')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    getOwnedPolls.mockReturnValue(new Promise(() => {})) // Never resolves
    render(<PollsPage />)
    expect(screen.getByText('Loading your polls...')).toBeInTheDocument()
  })

  it('renders empty state when no polls found', async () => {
    getOwnedPolls.mockResolvedValue([])
    render(<PollsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('You have not created any polls yet')).toBeInTheDocument()
    })
  })

  it('renders list of owned polls with whitelist status', async () => {
    const mockPolls = [
      { pollId: 1n, title: 'Poll 1', state: 1 },
      { pollId: 2n, title: 'Poll 2', state: 0 },
    ]
    getOwnedPolls.mockResolvedValue(mockPolls)
    isUserWhitelisted.mockResolvedValue(true)

    render(<PollsPage />)

    await waitFor(() => {
      expect(screen.getAllByTestId('poll-card')).toHaveLength(2)
      expect(screen.getByText('Poll 1 - 1 - 1 - VoteButton: Yes')).toBeInTheDocument()
      expect(screen.getByText('Poll 2 - 2 - 0 - VoteButton: No')).toBeInTheDocument()
    })
  })

  it('handles disconnected state', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    render(<PollsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('You have not created any polls yet')).toBeInTheDocument()
    })
  })
})
