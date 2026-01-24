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

describe('Integration Test: Vote Casting Page', () => {
  const mockPush = jest.fn()
  const mockPollId = '123'
  const mockUserAddress = '0xUser'
  
  // Mock implementations
  const { usePollRegistry } = require('@/hooks/usePollRegistry')
  const { useZKVote } = require('@/hooks/useZKVote')

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
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
    })
    
    // Default hasVoted response
    read.hasVoted.mockResolvedValue({ data: false, error: null })
  })

  it('renders loading state initially', () => {
     wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
     read.getPollById.mockReturnValue(new Promise(() => {}))
     render(<VoteOnPoll />)
     expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('shows "Voting is not active" if poll is Created (state 0)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
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
      expect(screen.getByText('Voting Closed')).toBeInTheDocument()
      expect(screen.getByText('This poll has not started yet.')).toBeInTheDocument()
      expect(screen.queryByText('Cast Vote')).not.toBeInTheDocument()
    })
  })

  it('shows "Voting is not active" if poll is Ended (state 2)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ 
      data: {
        title: 'Poll', 
        state: 2, // Ended
        options: ['A', 'B'] 
      },
      error: null
    })
    
    render(<VoteOnPoll />)

    await waitFor(() => {
      expect(screen.getByText('Voting Closed')).toBeInTheDocument()
      expect(screen.getByText('This poll has ended.')).toBeInTheDocument()
      expect(screen.queryByText('Cast Vote')).not.toBeInTheDocument()
    })
  })

  it('renders voting form if poll is Active (state 1)', async () => {
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
    
    // Override hook for ZK flow
    usePollRegistry.mockReturnValue({
      isZK: true,
      isRegistered: true,
      resultsPublished: false,
      merkleTreeDepth: 20,
      eligibilityModuleAddress: '0x1',
      voteStorageAddress: '0x2',
      isLoading: false,
      refetchRegistration: jest.fn(),
      refetchPollState: jest.fn(),
    })

    render(<VoteOnPoll />)

    // First expect Identity Upload
    await waitFor(() => {
      expect(screen.getByText('Authenticate Identity')).toBeInTheDocument()
    })

    // Simulate file upload
    const file = new File(['{"privateKey":"secret123","commitment":"789"}'], 'identity.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue('{"privateKey":"secret123","commitment":"789"}')
    const input = screen.getByLabelText('Upload Backup File')
    
    // We need fireEvent to trigger change
    const { fireEvent } = require('@testing-library/react')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Cast Vote')).toBeInTheDocument()
      expect(screen.queryByText('Voting Closed')).not.toBeInTheDocument()
    })
  })
})
