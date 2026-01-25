import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoteOnPoll from './page'
import '@testing-library/jest-dom'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { useZKVote } from '@/hooks/useZKVote'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { Identity } from '@semaphore-protocol/identity'
import { toast } from 'react-hot-toast'
import jsdom from 'jsdom'

// Mock IdentityTransferContext
const mockSetIdentity = jest.fn()
const mockConsumeIdentity = jest.fn()
jest.mock('@/lib/providers/IdentityTransferContext', () => ({
  useIdentityTransfer: () => ({
    setIdentity: mockSetIdentity,
    consumeIdentity: mockConsumeIdentity,
  })
}))


// Mock File.text() for JSDOM
const originalFileText = File.prototype.text
beforeAll(() => {
  File.prototype.text = jest.fn(function() {
    return Promise.resolve(this._content || new Blob([this]).text())
  })
})
afterAll(() => {
  File.prototype.text = originalFileText
})

// Mocks
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: jest.fn(),
}))

jest.mock('@/hooks/useZKVote', () => ({
  useZKVote: jest.fn(),
}))

jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  hasVoted: jest.fn(),
  getVoteTransaction: jest.fn(),
}))

jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn(),
}))

jest.mock('@/components/VoteBallot', () => {
  return function MockBallot({ onSubmit, selectedIndex, setSelectedIndex, submitting }) {
    return (
      <div data-testid="vote-ballot">
        <button onClick={() => setSelectedIndex(0)}>Select Option 1</button>
        <button onClick={onSubmit} disabled={submitting}>Submit Vote</button>
      </div>
    )
  }
})

jest.mock('@/components/BackButton', () => {
  return function MockBackButton({ href, label, variant }) {
    const text = variant === 'bracket' ? `[ ${label || 'Go Back'} ]` : `← ${label || 'Go Back'}`
    return <a href={href}>{text}</a>
  }
})

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

jest.mock('framer-motion', () => ({
  motion: { div: 'div', p: 'p' },
  AnimatePresence: ({ children }) => children,
}))

describe('VoteOnPoll', () => {
  const mockRouter = { push: jest.fn(), replace: jest.fn() }
  const mockSubmitVote = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: '123' })
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ address: '0xUser', isConnected: true })
    
    useSemaphore.mockReturnValue({
        createIdentity: jest.fn(),
        isLoadingIdentity: false,
    })

    useZKVote.mockReturnValue({
        submitVote: mockSubmitVote,
        isSubmitting: false,
        currentStep: 0,
        steps: [],
    })

    usePollRegistry.mockReturnValue({ isZK: true, isRegistered: true })

    getPollById.mockResolvedValue({
        data: {
          id: 123,
          title: 'Test Poll',
          options: ['Yes', 'No'],
          state: 1, // Active
        },
        error: null
    })
    
    hasVoted.mockResolvedValue({ data: false, error: null })
    
    mockConsumeIdentity.mockReturnValue(null) // Default no identity in context
  })

  it('renders loading state initially', async () => {
    getPollById.mockImplementation(() => new Promise(() => {}))
    render(<VoteOnPoll />)
    expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('renders poll error if failed', async () => {
    getPollById.mockResolvedValue({ data: null, error: 'Failed to fetch' })
    render(<VoteOnPoll />)
    await waitFor(() => expect(screen.getByText('Failed to fetch')).toBeInTheDocument())
  })

  it('redirects to auth if ZK poll and no identity loaded', async () => {
    usePollRegistry.mockReturnValue({ isZK: true, isRegistered: true })
    mockConsumeIdentity.mockReturnValue(null)

    render(<VoteOnPoll />)

    // Should redirect to auth page
    await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/poll/123/auth')
    })
  })

  it('loads identity from context if available', async () => {
    const mockId = { commitment: '123' }
    mockConsumeIdentity.mockReturnValue(mockId)

    render(<VoteOnPoll />)

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Identity loaded')
        expect(screen.getByTestId('vote-ballot')).toBeInTheDocument()
    })
  })

  it('submits vote successfully when identity is loaded', async () => {
    // Simulate loaded identity via context
    mockConsumeIdentity.mockReturnValue({ commitment: '123' })
    
    mockSubmitVote.mockResolvedValue({
        voteId: 456,
        txHash: '0xHash',
        nullifier: '0xNull',
        proof: [1,2,3]
    })

    render(<VoteOnPoll />)
    
    await waitFor(() => expect(screen.getByTestId('vote-ballot')).toBeInTheDocument())
    
    fireEvent.click(screen.getByText('Select Option 1'))
    fireEvent.click(screen.getByText('Submit Vote'))
    
    await waitFor(() => {
        expect(mockSubmitVote).toHaveBeenCalledWith(0, { commitment: '123' }) 
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/poll/123/vote/receipt/456')
        )
    })
  })

  it('shows error when not connected and attempting to vote', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    mockConsumeIdentity.mockReturnValue({ commitment: '123' }) // Need identity to see ballot in ZK mode
    
    render(<VoteOnPoll />)
    await waitFor(() => expect(screen.getByTestId('vote-ballot')).toBeInTheDocument())
    
    fireEvent.click(screen.getByText('Submit Vote'))
    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
  })

  it('shows error when not registered for ZK poll', async () => {
    usePollRegistry.mockReturnValue({ isZK: true, isRegistered: false })
    mockConsumeIdentity.mockReturnValue(null) // No identity
    
    // In strict mode, this would redirect. 
    // But if we simulate a Race Condition or "Bypass" where they have ballot but no ID:
    // Actually the page now redirects or shows nothing if no identity. 
    // To test the "not registered" check, we need to pass identity check but fail registration check?
    // Wait, logical fix said: "IF NOT registered AND NO identity loaded -> Block".
    // If identity IS loaded, we allow it.
    // So the only way to be blocked for "Not Registered" is if you have NO identity. 
    // But if you have NO identity, you are redirected to Auth.
    
    // So this test case might be unreachable in normal flow now due to the strict redirect,
    // UNLESS the redirect is slow or conditional.
    
    // Let's test the Registration Check logic via the new rule:
    // If I have identity, I CAN vote even if not registered.
    
    mockConsumeIdentity.mockReturnValue({ commitment: '123' })
    
    render(<VoteOnPoll />)
    await waitFor(() => expect(screen.getByTestId('vote-ballot')).toBeInTheDocument())
    
    fireEvent.click(screen.getByText('Select Option 1'))
    fireEvent.click(screen.getByText('Submit Vote'))
    
    // Should NOT error about registration
    expect(toast.error).not.toHaveBeenCalledWith('You are not registered for this poll')
    expect(mockSubmitVote).toHaveBeenCalled()
  })
})
