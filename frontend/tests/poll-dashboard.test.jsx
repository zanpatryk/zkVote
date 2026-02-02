import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PollsPage from '../src/app/poll/page'
import '@testing-library/jest-dom'

// Mock dependencies
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: jest.fn(),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock hooks
const mockUseOwnedPolls = jest.fn()
jest.mock('@/hooks/usePolls', () => ({
  useOwnedPolls: (...args) => mockUseOwnedPolls(...args),
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock PollCard to simplify
jest.mock('@/components/PollCard', () => {
    return function MockPollCard({ title, state }) {
      return (
        <div data-testid="poll-card">
          <h3>{title}</h3>
          <span>State: {state}</span>
        </div>
      )
    }
})

describe('Integration Test: Poll Dashboard (My Polls)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0x123' })
  })

  it('renders loading state', () => {
    mockUseOwnedPolls.mockReturnValue({ polls: [], isLoading: true })
    render(<PollsPage />)
    expect(screen.getByText('Loading your polls...')).toBeInTheDocument()
  })

  it('renders empty state when no polls', () => {
    mockUseOwnedPolls.mockReturnValue({ polls: [], isLoading: false })
    render(<PollsPage />)
    expect(screen.getByText("You haven't created any polls yet.")).toBeInTheDocument()
  })

  it('renders list of owned polls', async () => {
    const polls = [
      { pollId: '1', title: 'Poll One', state: 1, isWhitelisted: false },
      { pollId: '2', title: 'Poll Two', state: 0, isWhitelisted: true }
    ]
    mockUseOwnedPolls.mockReturnValue({ polls, isLoading: false })
    
    render(<PollsPage />)
    
    expect(screen.getByText('Poll One')).toBeInTheDocument()
    expect(screen.getByText('Poll Two')).toBeInTheDocument()
  })

  it('filters polls by search query', async () => {
    const polls = [
      { pollId: '1', title: 'Alpha Poll', state: 1 },
      { pollId: '2', title: 'Beta Poll', state: 1 }
    ]
    mockUseOwnedPolls.mockReturnValue({ polls, isLoading: false })
    
    render(<PollsPage />)
    
    expect(screen.getByText('Alpha Poll')).toBeInTheDocument()
    expect(screen.getByText('Beta Poll')).toBeInTheDocument()
    
    const searchInput = screen.getByPlaceholderText('Search your polls...')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })
    
    expect(screen.getByText('Alpha Poll')).toBeInTheDocument()
    expect(screen.queryByText('Beta Poll')).not.toBeInTheDocument()
  })
})
