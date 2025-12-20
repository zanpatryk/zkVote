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
    isLoadingIdentity: false,
    isRegistering: false,
    isCastingVote: false,
  }),
}))

describe('VoteOnPoll', () => {
  const mockPush = jest.fn()
  const mockPollId = '123'
  const mockUserAddress = '0xUser'

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
    useParams.mockReturnValue({ pollId: mockPollId })
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
      title: 'Poll', 
      state: 0, // Created
      options: ['A', 'B'] 
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
      title: 'Poll', 
      state: 2, // Ended
      options: ['A', 'B'] 
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
      title: 'Poll', 
      state: 1, // Active
      options: ['A', 'B'] 
    })
    read.hasVoted.mockResolvedValue(false)
    
    render(<VoteOnPoll />)

    // First expect Identity Upload
    await waitFor(() => {
      expect(screen.getByText('Authenticate Identity')).toBeInTheDocument()
    })

    // Simulate file upload
    const file = new File(['{"privateKey":"secret123","commitment":"789"}'], 'identity.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue('{"privateKey":"secret123","commitment":"789"}')
    const input = screen.getByLabelText('Upload Identity File')
    
    // We need fireEvent to trigger change
    const { fireEvent } = require('@testing-library/react')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Cast Vote')).toBeInTheDocument()
      expect(screen.queryByText('Voting Closed')).not.toBeInTheDocument()
    })
  })
})
