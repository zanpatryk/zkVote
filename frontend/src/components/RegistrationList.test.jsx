import { render, screen, waitFor, act } from '@testing-library/react'
import RegistrationList from './RegistrationList'
import * as read from '@/lib/blockchain/engine/read'
import * as wagmi from 'wagmi'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getModules: jest.fn(),
  getGroupMembers: jest.fn(),
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

describe('RegistrationList', () => {
  const mockPollId = '123'
  const mockParams = {
    eligibilityModule: '0xEligibility'
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    read.getModules.mockResolvedValue(mockParams)
    wagmi.useWatchContractEvent.mockImplementation(({ onLogs }) => {}) // No-op default
  })

  it('renders loading state initially', async () => {
    read.getGroupMembers.mockReturnValue(new Promise(() => {})) // Pending promise
    
    // Wrap in act because useEffect triggers state update
    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })
    
    expect(screen.getByText('Loading registry...')).toBeInTheDocument()
  })

  it('renders empty state when no registrations fetched', async () => {
    read.getGroupMembers.mockResolvedValue([])
    
    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })
    
    expect(screen.getByText('Registered Identities (0)')).toBeInTheDocument()
    expect(screen.getByText('No identities registered yet.')).toBeInTheDocument()
  })

  it('renders registration list when data is fetched', async () => {
    const mockMembers = [
      { identityCommitment: '123456789', transactionHash: '0xabc', blockNumber: 100n },
      { identityCommitment: '987654321', transactionHash: '0xdef', blockNumber: 101n },
    ]
    read.getGroupMembers.mockResolvedValue(mockMembers)

    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })

    expect(screen.getByText('Registered Identities (2)')).toBeInTheDocument()
    expect(screen.getByText('123456789')).toBeInTheDocument()
    expect(screen.getByText('987654321')).toBeInTheDocument()
  })

  it('renders error state on fetch failure', async () => {
    read.getGroupMembers.mockRejectedValue(new Error('Fetch failed'))

    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })

    expect(screen.getByText('Failed to load registrations')).toBeInTheDocument()
  })

  it('updates list on new MemberAdded event', async () => {
    read.getGroupMembers.mockResolvedValue([])
    
    // Capture the event listener callback
    let eventCallback
    wagmi.useWatchContractEvent.mockImplementation(({ onLogs }) => {
        eventCallback = onLogs
    })

    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })
    
    expect(screen.getByText('Registered Identities (0)')).toBeInTheDocument()

    // Simulate new event
    const newLog = { 
        args: { identityCommitment: 999n }, 
        transactionHash: '0xNewTx', 
        blockNumber: 102n 
    }
    
    // Act
    await act(async () => {
         eventCallback([newLog])
    })

    expect(screen.getByText('999')).toBeInTheDocument()
    expect(screen.getByText('Registered Identities (1)')).toBeInTheDocument()
  })
})
