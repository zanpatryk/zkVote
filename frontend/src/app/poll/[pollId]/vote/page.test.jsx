import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoteOnPoll from './page'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { useSemaphore } from '@/hooks/useSemaphore'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  hasVoted: jest.fn(),
  getVoteTransaction: jest.fn(),
}))

// Mock useSemaphore
jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock Identity class import since it's used dynamically
// We mock module '@semaphore-protocol/identity'
jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn().mockImplementation((privateKey) => ({
    privateKey,
    commitment: BigInt(12345)
  }))
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    label: ({ children, ...props }) => <label {...props}>{children}</label>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
    input: (props) => <input {...props} />,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('VoteOnPoll Page', () => {
  const mockPollId = '123'
  const mockAddress = '0x123'
  const mockRouter = { push: jest.fn() }
  const mockPollData = {
    title: 'Test Poll',
    description: 'Test Description',
    options: ['Option 1', 'Option 2'],
    state: 1, // Active
  }

  const mockCastVote = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId })
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ address: mockAddress, isConnected: true })
    useSemaphore.mockReturnValue({
      castVote: mockCastVote,
      isCastingVote: false
    })
    getPollById.mockResolvedValue(mockPollData)
    hasVoted.mockResolvedValue(false)
    getVoteTransaction.mockResolvedValue(null)
  })

  it('renders loading state initially', () => {
    getPollById.mockReturnValue(new Promise(() => {}))
    render(<VoteOnPoll />)
    expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('renders Identity Upload screen when poll loaded and user has not voted', async () => {
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Authenticate Identity')).toBeInTheDocument()
    })
    expect(screen.getByText('Upload Identity File', { selector: 'label' })).toBeInTheDocument()
    // Ballot should not be visible yet
    expect(screen.queryByText(mockPollData.title)).not.toBeInTheDocument()
  })

  it('transitions to Ballot when valid identity file is uploaded', async () => {
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Authenticate Identity')).toBeInTheDocument()
    })

    const file = new File(['{"privateKey": "secret"}'], 'identity.json', { type: 'application/json' })
    const input = screen.getByLabelText('Upload Identity File')

    // Mock file.text() as it's not implemented in jsdom
    file.text = jest.fn().mockResolvedValue('{"privateKey": "secret"}')

    await echoFileUpload(input, file)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Identity loaded successfully!')
    })

    // Now showing ballot
    expect(screen.getByText(mockPollData.title)).toBeInTheDocument()
    expect(screen.queryByText('Authenticate Identity')).not.toBeInTheDocument()
  })

  it('handles vote submission with loaded identity', async () => {
    mockCastVote.mockResolvedValue({ voteId: 'v1', txHash: '0xabc' })
    render(<VoteOnPoll />)
    
    // Upload Identity
    await waitFor(() => screen.getByLabelText('Upload Identity File'))
    const file = new File(['{"privateKey": "secret"}'], 'identity.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue('{"privateKey": "secret"}')
    await echoFileUpload(screen.getByLabelText('Upload Identity File'), file)

    await waitFor(() => screen.getByText('Option 1'))

    // Select Option
    const radio = screen.getAllByRole('radio')[0]
    fireEvent.click(radio)

    // Vote
    const submitBtn = screen.getByText('Cast Vote')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCastVote).toHaveBeenCalledWith(mockPollId, 0, expect.objectContaining({ privateKey: 'secret' }))
    })
    
    expect(mockRouter.push).toHaveBeenCalledWith(`/poll/${mockPollId}/vote/receipt/v1?txHash=0xabc`)
  })

  it('shows already voted view immediately if user has voted', async () => {
    hasVoted.mockResolvedValue(true)
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Vote Cast')).toBeInTheDocument()
    })
    // Should NOT show upload screen
    expect(screen.queryByText('Authenticate Identity')).not.toBeInTheDocument()
  })

  it('shows error for invalid identity file', async () => {
    render(<VoteOnPoll />)
    await waitFor(() => screen.getByLabelText('Upload Identity File'))

    const file = new File(['{"invalid": "data"}'], 'bad.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue('{"invalid": "data"}')
    
    await echoFileUpload(screen.getByLabelText('Upload Identity File'), file)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid identity file')
    })
    // Should still be on upload screen
    expect(screen.getByText('Authenticate Identity')).toBeInTheDocument()
  })
})

async function echoFileUpload(input, file) {
    fireEvent.change(input, { target: { files: [file] } })
}
