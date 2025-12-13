import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreatePollPage from '../src/app/poll/create/page'
import '@testing-library/jest-dom'
import { toast } from 'react-hot-toast'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock blockchain write function
const mockCreatePoll = jest.fn()
jest.mock('../src/lib/blockchain/engine/write', () => ({
  createPoll: (...args) => mockCreatePoll(...args),
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('Integration Test: Poll Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sanity check: toast mock works', () => {
    toast.error('test')
    expect(toast.error).toHaveBeenCalledWith('test')
  })

  it('shows error if wallet is not connected', async () => {
    mockUseAccount.mockReturnValue({ isConnected: false })
    const { container } = render(<CreatePollPage />)

    // Try submitting the form directly
    const form = container.querySelector('form')
    fireEvent.submit(form)

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    })
    expect(mockCreatePoll).not.toHaveBeenCalled()
  })

  it('validates form inputs', async () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    const { container } = render(<CreatePollPage />)
    const form = container.querySelector('form')

    // Default state: options are empty strings, so cleanOptions is []
    // Code checks options length < 2 first.
    fireEvent.submit(form)
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Need at least 2 options')
    })

    // Now fill options to satisfy first check
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    fireEvent.change(optionInputs[0], { target: { value: 'A' } })
    fireEvent.change(optionInputs[1], { target: { value: 'B' } })

    // Now submit with empty title (default)
    fireEvent.submit(form)
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Poll title is required')
    })
  })

  it('successfully creates a poll and redirects', async () => {
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockCreatePoll.mockResolvedValue(123n) // Mock returning pollId

    const { container } = render(<CreatePollPage />)
    const form = container.querySelector('form')

    // Fill Title
    const titleInput = screen.getByPlaceholderText('What is your favorite color?')
    fireEvent.change(titleInput, { target: { value: 'Best Framework?' } })

    // Fill Description
    const descInput = screen.getByPlaceholderText('Add more context...')
    fireEvent.change(descInput, { target: { value: 'React vs Vue' } })

    // Fill Options
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    fireEvent.change(optionInputs[0], { target: { value: 'React' } })
    fireEvent.change(optionInputs[1], { target: { value: 'Vue' } })

    // Submit
    fireEvent.submit(form)

    // Verify loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith({
        title: 'Best Framework?',
        description: 'React vs Vue',
        options: ['React', 'Vue'],
      })
      expect(mockPush).toHaveBeenCalledWith('/poll/123/whitelist')
    })
  })

  it('handles creation errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockCreatePoll.mockRejectedValue(new Error('Transaction failed'))

    const { container } = render(<CreatePollPage />)
    const form = container.querySelector('form')

    // Fill minimal valid form
    fireEvent.change(screen.getByPlaceholderText('What is your favorite color?'), { target: { value: 'Test' } })
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    fireEvent.change(optionInputs[0], { target: { value: 'A' } })
    fireEvent.change(optionInputs[1], { target: { value: 'B' } })

    fireEvent.submit(form)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred.')
      expect(screen.getByText('Create Poll')).toBeInTheDocument() // Loading state cleared
    })
    
    consoleSpy.mockRestore()
  })
})
