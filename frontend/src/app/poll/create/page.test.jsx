
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreatePollPage from './page'
import { createPoll } from '@/lib/blockchain/engine/write'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { elgamal } from '@zkvote/lib'
import { toast } from 'react-hot-toast'
import '@testing-library/jest-dom'

jest.mock('@/lib/contracts', () => ({
  MODULE_ADDRESSES: {
    semaphoreEligibility: '0xSemaphoreEligibility',
    eligibilityV0: '0xEligibilityV0',
    zkElGamalVoteVector: '0xZkElGamalVoteVector',
    voteStorageV0: '0xVoteStorageV0'
  }
}))

// Mock dependencies
jest.mock('@/lib/blockchain/engine/write', () => ({
  createPoll: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
  }
}))

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('@zkvote/lib', () => ({
  elgamal: {
    init: jest.fn(),
    generateKeyPair: jest.fn(),
  }
}))

describe('CreatePollPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
    useAccount.mockReturnValue({ isConnected: true })
  })

  it('renders creation form', () => {
    render(<CreatePollPage />)
    expect(screen.getByText('Create New Poll')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Should we adopt the new governance proposal?')).toBeInTheDocument()
  })

  it('validates form before submission', async () => {
    render(<CreatePollPage />)
    
    const form = screen.getByText('Launch Poll').closest('form')
    
    // 1. Submit with empty title
    fireEvent.submit(form)
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Poll title is required')
    })

    // 2. Fill title but leave options empty
    fireEvent.change(screen.getByPlaceholderText('e.g., Should we adopt the new governance proposal?'), { target: { value: 'My Poll' } })
    fireEvent.submit(form)
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Need at least 2 options')
    })
  })

  it('submits valid poll', async () => {
    createPoll.mockResolvedValue(123n)
    render(<CreatePollPage />)

    fireEvent.change(screen.getByPlaceholderText('e.g., Should we adopt the new governance proposal?'), { target: { value: 'My Poll' } })
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Yes' } })
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'No' } })

    const form = screen.getByText('Launch Poll').closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(createPoll).toHaveBeenCalledWith({
          title: 'My Poll',
          description: '',
          options: ['Yes', 'No'],
          // Default isAnonymous=true, depth=20
          merkleTreeDepth: 20, 
          // Default modules
          eligibilityModule: '0xSemaphoreEligibility', // Assuming mock/constant value
          voteStorage: '0xVoteStorageV0',
          voteStorageParams: null
      })
      expect(mockPush).toHaveBeenCalledWith('/poll/123/whitelist')
    })
  })

  it('handles wallet disconnected', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    render(<CreatePollPage />)

    const form = screen.getByText('Launch Poll').closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    })
  })
})
