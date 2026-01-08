import { render, screen, waitFor } from '@testing-library/react'
import VotesList from './VotesList'
import * as read from '@/lib/blockchain/engine/read'
import * as wagmi from 'wagmi'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getModules: jest.fn(),
  getPollVotes: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useWatchContractEvent: jest.fn(),
}))

// Mock viem
jest.mock('viem', () => ({
  parseAbiItem: jest.fn(),
}))



// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('VotesList', () => {
  const mockPollId = '123'
  const mockVoteStorageAddress = '0xVoteStorage'
  
  beforeEach(() => {
    jest.clearAllMocks()
    read.getModules.mockResolvedValue({ voteStorage: mockVoteStorageAddress })
    wagmi.useWatchContractEvent.mockImplementation(({ onLogs }) => {}) // No-op default
  })

  it('renders loading state initially', () => {
    read.getPollVotes.mockReturnValue(new Promise(() => {})) // Pending promise
    render(<VotesList pollId={mockPollId} />)
    // We expect the loader (implied by just rendering without crashing and waiting)
    // Since component is simple, we check if table is NOT there yet
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders empty state when no votes fetched', async () => {
    read.getPollVotes.mockResolvedValue([])
    render(<VotesList pollId={mockPollId} />)
    
    await waitFor(() => {
      expect(screen.getByText('Cast Votes (0)')).toBeInTheDocument()
      expect(screen.getByText('No votes recorded yet.')).toBeInTheDocument()
    })
  })

  it('renders votes list when votes are fetched', async () => {
    const mockVotes = [
      { voter: '0x123', voteId: '1', transactionHash: '0xabc', blockNumber: 100n },
      { voter: '0x456', voteId: '2', transactionHash: '0xdef', blockNumber: 101n },
    ]
    read.getPollVotes.mockResolvedValue(mockVotes)

    render(<VotesList pollId={mockPollId} />)

    await waitFor(() => {
      expect(screen.getByText('Cast Votes (2)')).toBeInTheDocument()
      expect(screen.getByText('0x123')).toBeInTheDocument()
      expect(screen.getByText('0x456')).toBeInTheDocument()
    })
  })

  it('updates list on new vote event', async () => {
    read.getPollVotes.mockResolvedValue([])
    
    // Capture the event listener callback
    let eventCallback
    wagmi.useWatchContractEvent.mockImplementation(({ onLogs }) => {
        eventCallback = onLogs
    })

    render(<VotesList pollId={mockPollId} />)
    
    await waitFor(() => {
         expect(screen.getByText('Cast Votes (0)')).toBeInTheDocument()
    })

    // Simulate new event
    const newLog = { 
        args: { voter: '0xNew', voteId: 3n }, 
        transactionHash: '0xNewTx', 
        blockNumber: 102n 
    }
    
    // Act
    eventCallback([newLog])

    await waitFor(() => {
        expect(screen.getByText('Cast Votes (1)')).toBeInTheDocument()
        expect(screen.getByText('0xNew')).toBeInTheDocument()
    })
  })
})
