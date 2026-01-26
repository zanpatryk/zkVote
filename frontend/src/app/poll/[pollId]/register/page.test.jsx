import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import RegisterPage from './page'
import { useParams } from 'next/navigation'
import { useRegistrationFlow } from '@/hooks/useRegistrationFlow'
import toast from 'react-hot-toast'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/hooks/useRegistrationFlow', () => ({
  useRegistrationFlow: jest.fn(),
}))

// Robust mock for react-hot-toast
jest.mock('react-hot-toast', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
    ...mockToast,
  }
})

describe('RegisterPage', () => {
  const mockPollId = '123'
  const mockPollData = {
    id: mockPollId,
    title: 'Test Poll',
    description: 'Test Description',
    state: 0,
  }
  const mockHandleRegister = jest.fn()
  const mockDownloadIdentity = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    useParams.mockReturnValue({ pollId: mockPollId })

    useRegistrationFlow.mockReturnValue({
      poll: mockPollData,
      pollId: mockPollId,
      isRegistered: false,
      registeredIdentity: null,
      isLoading: false,
      isLoadingIdentity: false,
      isRegistering: false,
      error: null,
      handleRegister: mockHandleRegister,
      downloadIdentity: mockDownloadIdentity
    })
  })

  it('renders loading state', async () => {
    useRegistrationFlow.mockReturnValue({
      isLoading: true,
      pollId: mockPollId
    })

    render(<RegisterPage />)
    expect(screen.getByText('Loading poll details...')).toBeInTheDocument()
  })

  it('renders poll not found if data is missing', async () => {
    useRegistrationFlow.mockReturnValue({
      isLoading: false,
      poll: null,
      error: null,
      pollId: mockPollId
    })
    
    render(<RegisterPage />)
    expect(screen.getByText('Poll not found')).toBeInTheDocument()
  })

  it('renders error message if fetching fails', async () => {
    useRegistrationFlow.mockReturnValue({
      isLoading: false,
      poll: null,
      error: 'Network error',
      pollId: mockPollId
    })
    
    render(<RegisterPage />)
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('renders registration instructions when not registered', async () => {
    render(<RegisterPage />)
    expect(screen.getByText('Register & Create Identity')).toBeInTheDocument()
    expect(screen.getByText(/Test Poll/)).toBeInTheDocument()
  })

  it('renders success UI when already registered', async () => {
     useRegistrationFlow.mockReturnValue({
        isLoading: false,
        poll: mockPollData,
        isRegistered: true,
        registeredIdentity: null,
        pollId: mockPollId,
        downloadIdentity: mockDownloadIdentity
     })
      
     render(<RegisterPage />)
     expect(screen.getByText('You are registered!')).toBeInTheDocument()
  })

  it('calls handleRegister when button clicked', async () => {
    render(<RegisterPage />)
    
    const button = screen.getByText('Register & Create Identity')
    fireEvent.click(button)

    expect(mockHandleRegister).toHaveBeenCalled()
  })

  it('shows success UI immediately after registration', async () => {
    const mockIdentity = 'mock-identity'
    
    // Initial render
    const { rerender } = render(<RegisterPage />)
    expect(screen.getByText('Register & Create Identity')).toBeInTheDocument()

    // Simulate successful registration by updating the hook return value
    useRegistrationFlow.mockReturnValue({
      poll: mockPollData,
      pollId: mockPollId,
      isRegistered: false,
      registeredIdentity: mockIdentity,
      isLoading: false,
      isLoadingIdentity: false,
      isRegistering: false,
      error: null,
      handleRegister: mockHandleRegister,
      downloadIdentity: mockDownloadIdentity
    })

    rerender(<RegisterPage />)

    expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
    expect(screen.getByText('Download Identity')).toBeInTheDocument()
  })
})
