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
  toast: { error: jest.fn() },
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
     expect(screen.getByText('Loading poll...')).toBeInTheDocument()
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
      expect(screen.getByText('Voting is not active')).toBeInTheDocument()
      expect(screen.getByText('This poll has not started yet.')).toBeInTheDocument()
      expect(screen.queryByText('Submit vote')).not.toBeInTheDocument()
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
      expect(screen.getByText('Voting is not active')).toBeInTheDocument()
      expect(screen.getByText('This poll has ended.')).toBeInTheDocument()
      expect(screen.queryByText('Submit vote')).not.toBeInTheDocument()
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

    await waitFor(() => {
      expect(screen.getByText('Submit vote')).toBeInTheDocument()
      expect(screen.queryByText('Voting is not active')).not.toBeInTheDocument()
    })
  })
})
