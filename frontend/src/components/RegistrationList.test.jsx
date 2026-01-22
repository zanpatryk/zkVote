import { render, screen, waitFor, act } from '@testing-library/react'
import RegistrationList from './RegistrationList'
import { usePollRegistrations } from '@/hooks/usePollRegistrations'

// Mock the hook
jest.mock('@/hooks/usePollRegistrations', () => ({
  usePollRegistrations: jest.fn(),
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
  
  beforeEach(() => {
    jest.clearAllMocks()
    usePollRegistrations.mockReturnValue({
        registrations: [],
        loading: false,
        error: null
    })
  })

  it('renders loading state initially', async () => {
    usePollRegistrations.mockReturnValue({ registrations: [], loading: true, error: null })
    
    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })
    
    expect(screen.getByText('Loading registry...')).toBeInTheDocument()
  })

  it('renders empty state when no registrations fetched', async () => {
    usePollRegistrations.mockReturnValue({ registrations: [], loading: false, error: null })
    
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
    usePollRegistrations.mockReturnValue({ registrations: mockMembers, loading: false, error: null })

    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })

    expect(screen.getByText('Registered Identities (2)')).toBeInTheDocument()
    expect(screen.getByText('123456789')).toBeInTheDocument()
    expect(screen.getByText('987654321')).toBeInTheDocument()
  })

  it('renders error state on fetch failure', async () => {
    usePollRegistrations.mockReturnValue({ registrations: [], loading: false, error: 'Failed to load registrations' })

    await act(async () => {
        render(<RegistrationList pollId={mockPollId} />)
    })

    expect(screen.getByText('Failed to load registrations')).toBeInTheDocument()
  })
})
