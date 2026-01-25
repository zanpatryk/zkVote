import { render, screen, waitFor } from '@testing-library/react'
import VoteOnPoll from '../src/app/poll/[pollId]/vote/page'
import * as read from '@/lib/blockchain/engine/read'
import * as wagmi from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  hasVoted: jest.fn(),
  getVoteTransaction: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  castVote: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn(), loading: jest.fn() },
}))

jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn().mockImplementation(() => ({
    commitment: { toString: () => '123' }
  })),
}))

jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: jest.fn().mockReturnValue({
    identity: null,
    createIdentity: jest.fn(),
    register: jest.fn(),
    castVote: jest.fn(),
    downloadIdentity: jest.fn(),
    hasStoredIdentity: jest.fn().mockReturnValue(false),
    loadIdentityFromStorage: jest.fn().mockReturnValue(null),
    isLoadingIdentity: false,
    isRegistering: false,
    isCastingVote: false,
  }),
}))

jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('@/hooks/useZKVote', () => ({
  useZKVote: jest.fn(),
}))

// Mock IdentityTransferContext
const mockSetIdentity = jest.fn()
const mockConsumeIdentity = jest.fn()
jest.mock('@/lib/providers/IdentityTransferContext', () => ({
  useIdentityTransfer: () => ({
    setIdentity: mockSetIdentity,
    consumeIdentity: mockConsumeIdentity,
  })
}))

describe('Integration Test: Vote Casting Page', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockPollId = '123'
  const mockUserAddress = '0xUser'
  
  // Mock implementations
  const { usePollRegistry } = require('@/hooks/usePollRegistry')
  const { useZKVote } = require('@/hooks/useZKVote')

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush, replace: mockReplace })
    useParams.mockReturnValue({ pollId: mockPollId })
    
    // Default hook returns
    usePollRegistry.mockReturnValue({
      isZK: false,
      isRegistered: true,
      resultsPublished: false,
      merkleTreeDepth: 0,
      eligibilityModuleAddress: '0x1',
      voteStorageAddress: '0x2',
      isLoading: false,
      refetchRegistration: jest.fn(),
      refetchPollState: jest.fn(),
    })
    
    useZKVote.mockReturnValue({
       castVote: jest.fn(),
       isCasting: false,
       steps: [],
    })
    
    // Default hasVoted response
    read.hasVoted.mockResolvedValue({ data: false, error: null })
  })

  it('renders loading state initially', () => {
     wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
     read.getPollById.mockReturnValue(new Promise(() => {}))
     mockConsumeIdentity.mockReturnValue(null) // Mock context return
     render(<VoteOnPoll />)
     expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('shows "Voting is not active" if poll is Created (state 0)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    mockConsumeIdentity.mockReturnValue(null)
    read.getPollById.mockResolvedValue({ 
      data: {
        title: 'Poll', 
        state: 0, // Created
        options: ['A', 'B'] 
      },
      error: null
    })
    
    render(<VoteOnPoll />)

    await waitFor(() => {
      // The logic in VoteOnPoll shows "Loading ballot..." -> then loads -> then shows error or ballot or status.
      // Actually VoteOnPoll doesn't show "Voting Closed" directly?
      // Wait, let's look at VoteOnPoll logic. 
      // It renders VoteBallot. 
      // VoteBallot handles the "state check"?
      // If Page passes `poll`, VoteBallot is rendered. 
      // VoteBallot checks `poll.state`.
      // Ensure VoteOnPoll doesn't block rendering VoteBallot if state is 0.
      // Yes, `showBallot` is true if `poll.state !== 1` (Active)? 
      // `const showBallot = alreadyVoted || (isZK ? loadedIdentity : true) || (poll && poll.state !== 1)`
      // If state is 0, showBallot is TRUE. 
      // So checks are inside VoteBallot.
    })
    // NOTE: Does test runner have VoteBallot? The "integration" test imports the real Component usually.
    // If mocking VoteBallot in previous tests, does it apply here?
    // Jest mocks are global per file.
    // In THIS file, we are NOT mocking VoteBallot. So it renders real VoteBallot.
    // So we should see "Voting not active".
    // VoteBallot: "Voting is not active" if state is not 1.
    // Let's verify text content.
    // Actually VoteBallot implementation:
    // "This poll has not started yet." (state created)
    // "This poll has ended." (state ended)
    
     await waitFor(() => {
        expect(screen.getByText('This poll has not started yet.')).toBeInTheDocument()
     })
  })

  it('redirects to auth if poll is Active (state 1) and No Identity', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ 
      data: {
        title: 'Poll', 
        state: 1, // Active
        options: ['A', 'B'] 
      },
      error: null
    })
    
    usePollRegistry.mockReturnValue({
       isZK: true,
       isRegistered: true,
    })
    
    // No ID
    mockConsumeIdentity.mockReturnValue(null)

    render(<VoteOnPoll />)

    await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/poll/123/auth')
    })
  })

  it('renders voting form if poll is Active (state 1) and Identity is Loaded', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ 
      data: {
        title: 'Poll', 
        state: 1, // Active
        options: ['A', 'B'] 
      },
      error: null
    })
    read.hasVoted.mockResolvedValue({ data: false, error: null })
    
    usePollRegistry.mockReturnValue({
      isZK: true,
      isRegistered: true, 
      isLoading: false,
    })
    
    // Identity Present
    mockConsumeIdentity.mockReturnValue({ commitment: '123' })

    render(<VoteOnPoll />)

    await waitFor(() => {
      expect(screen.getByText('Cast Vote')).toBeInTheDocument()
    })
  })
})
