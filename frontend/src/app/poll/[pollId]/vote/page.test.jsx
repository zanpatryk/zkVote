import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoteOnPoll from './page'
import { getPollById, hasVoted, getVoteTransaction } from '@/lib/blockchain/engine/read'
import { castVote } from '@/lib/blockchain/engine/write'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  hasVoted: jest.fn(),
  getVoteTransaction: jest.fn(), // Mock the new function
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  castVote: jest.fn(),
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

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId })
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ address: mockAddress, isConnected: true })
    getPollById.mockResolvedValue(mockPollData)
    hasVoted.mockResolvedValue(false)
    getVoteTransaction.mockResolvedValue(null)
  })

  it('renders loading state initially', () => {
    getPollById.mockReturnValue(new Promise(() => {}))
    render(<VoteOnPoll />)
    expect(screen.getByText('Loading ballot...')).toBeInTheDocument()
  })

  it('renders poll details and options when loaded', async () => {
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText(mockPollData.title)).toBeInTheDocument()
    })
    expect(screen.getByText(mockPollData.description)).toBeInTheDocument()
    mockPollData.options.forEach(opt => {
      expect(screen.getByText(opt)).toBeInTheDocument()
    })
  })

  it('shows error if poll fails to load', async () => {
    getPollById.mockResolvedValue(null)
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Poll data could not be loaded.')).toBeInTheDocument()
    })
  })

  it('shows already voted message if user has voted', async () => {
    hasVoted.mockResolvedValue(true)
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Vote Cast')).toBeInTheDocument()
      expect(screen.getByText('You have already voted.')).toBeInTheDocument()
    })
    expect(screen.queryByText('Cast Vote')).not.toBeInTheDocument()
    expect(screen.queryByText('View Receipt')).not.toBeInTheDocument() // No tx hash yet
  })
  
  it('shows block explorer link if user has voted and tx hash is found', async () => {
    hasVoted.mockResolvedValue(true)
    getVoteTransaction.mockResolvedValue('0xabcdef123456') // Mock tx hash
    
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Vote Cast')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: /View Receipt/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://sepolia.etherscan.io/tx/0xabcdef123456')
    })
  })

  it('handles option selection and submission', async () => {
    const mockVoteId = 'vote-123'
    castVote.mockResolvedValue({ voteId: mockVoteId, txHash: '0xabc' })
    
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    // Select option 1 (index 0)
    const radio = screen.getAllByRole('radio')[0]
    fireEvent.click(radio)
    expect(radio).toBeChecked()

    // Submit
    const submitBtn = screen.getByText('Cast Vote')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(castVote).toHaveBeenCalledWith(mockPollId, { optionIndex: 0 })
    })
    expect(mockRouter.push).toHaveBeenCalledWith(`/poll/${mockPollId}/vote/receipt/${mockVoteId}?txHash=0xabc`)
  })

  it('shows error toast if disconnected when submitting', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText(mockPollData.title)).toBeInTheDocument()
    })

    const submitBtn = screen.getByText('Cast Vote')
    fireEvent.click(submitBtn)

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    expect(castVote).not.toHaveBeenCalled()
  })

  it('shows error toast if no option selected', async () => {
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText(mockPollData.title)).toBeInTheDocument()
    })

    const submitBtn = screen.getByText('Cast Vote')
    fireEvent.click(submitBtn)

    expect(toast.error).toHaveBeenCalledWith('Please select an option to vote for')
    expect(castVote).not.toHaveBeenCalled()
  })

  it('handles submission error', async () => {
    castVote.mockRejectedValue(new Error('Submission failed'))
    
    render(<VoteOnPoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    const radio = screen.getAllByRole('radio')[0]
    fireEvent.click(radio)
    
    const submitBtn = screen.getByText('Cast Vote')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(castVote).toHaveBeenCalled()
    })
    
    // Should reset submitting state
    expect(screen.getByText('Cast Vote')).toBeInTheDocument()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})
