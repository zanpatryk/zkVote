import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreatePollPage from './page'
import '@testing-library/jest-dom'

// Mock dependencies
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ isConnected: true })),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  createPoll: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    promise: jest.fn((p) => p),
  },
}))

describe('CreatePollPage', () => {
  const { createPoll } = require('@/lib/blockchain/engine/write')
  const { toast } = require('react-hot-toast')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders create poll form', () => {
    render(<CreatePollPage />)
    expect(screen.getByText('Create New Poll')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What is your favorite color?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Option 2')).toBeInTheDocument()
  })

  it('adds and removes options', () => {
    render(<CreatePollPage />)
    
    fireEvent.click(screen.getByText('+ Add Option'))
    expect(screen.getByPlaceholderText('Option 3')).toBeInTheDocument()

    const removeButtons = screen.getAllByText('Remove')
    fireEvent.click(removeButtons[0])
    expect(screen.queryByPlaceholderText('Option 3')).not.toBeInTheDocument()
  })

  it('submits form successfully', async () => {
    createPoll.mockResolvedValue(BigInt(123))
    render(<CreatePollPage />)

    fireEvent.change(screen.getByPlaceholderText('What is your favorite color?'), { target: { value: 'Test Poll' } })
    fireEvent.change(screen.getByPlaceholderText('Option 1'), { target: { value: 'Yes' } })
    fireEvent.change(screen.getByPlaceholderText('Option 2'), { target: { value: 'No' } })

    fireEvent.click(screen.getByText('Create Poll'))

    await waitFor(() => {
      expect(createPoll).toHaveBeenCalledWith({
        title: 'Test Poll',
        description: '',
        options: ['Yes', 'No'],
      })
      expect(mockPush).toHaveBeenCalledWith('/poll/123/whitelist')
    })
  })

  it('shows error if disconnected', async () => {
    const { useAccount } = require('wagmi')
    useAccount.mockReturnValue({ isConnected: false })
    
    const { container } = render(<CreatePollPage />)
    fireEvent.submit(container.querySelector('form'))

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    expect(createPoll).not.toHaveBeenCalled()
  })

  it('shows error if validation fails', async () => {
    const { container } = render(<CreatePollPage />)
    fireEvent.submit(container.querySelector('form'))

    expect(toast.error).toHaveBeenCalled() // Title required or options required
    expect(createPoll).not.toHaveBeenCalled()
  })
})
