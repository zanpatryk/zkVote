import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import RegisterPage from './page'
import { useSemaphore } from '@/hooks/useSemaphore'
import { useRouter, useParams } from 'next/navigation'
import { getPollById } from '@/lib/blockchain/engine/read'
import toast from 'react-hot-toast'
import { useAccount, useReadContract } from 'wagmi'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
}))

jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
}))

jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

// Robust mock for react-hot-toast supporting default and named imports
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

// Mock fetch for downloading identity
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(['identity-data'], { type: 'application/json' })),
  })
)

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:url')
global.URL.revokeObjectURL = jest.fn()

describe('RegisterPage', () => {
  const mockPush = jest.fn()
  const mockCreateIdentity = jest.fn()
  const mockRegister = jest.fn().mockResolvedValue(true)
  const mockDownloadIdentity = jest.fn()

  const mockPollId = '123'
  const mockPollData = {
    id: mockPollId,
    title: 'Test Poll',
    description: 'Test Description',
    state: 0, // Created
  }

  const { usePollRegistry } = require('@/hooks/usePollRegistry')

  beforeEach(() => {
    jest.clearAllMocks()

    useRouter.mockReturnValue({ push: mockPush })
    useParams.mockReturnValue({ pollId: mockPollId })
    useAccount.mockReturnValue({ address: '0x123', isConnected: true })
    useReadContract.mockReturnValue({ data: false, refetch: jest.fn() })

    usePollRegistry.mockReturnValue({
        isLoading: false,
        isRegistered: false,
        isZK: true,
        eligibilityModuleAddress: '0x123',
        refetchRegistration: jest.fn(),
    })

    useSemaphore.mockReturnValue({
      createIdentity: mockCreateIdentity,
      register: mockRegister,
      downloadIdentity: mockDownloadIdentity,
      saveIdentityToStorage: jest.fn(),
      isLoadingIdentity: false,
      isRegistering: false,
    })

    getPollById.mockResolvedValue({ data: mockPollData, error: null })
  })

  const renderComponent = async () => {
    const paramsPromise = Promise.resolve({ pollId: mockPollId })
    let component
    await act(async () => {
      component = render(<RegisterPage params={paramsPromise} />)
    })
    return component
  }

  it('renders loading state initially', async () => {
    // Delay the resolution to catch the loading state
    let resolvePoll
    getPollById.mockReturnValue(new Promise(resolve => {
      resolvePoll = resolve
    }))

    const paramsPromise = Promise.resolve({ pollId: mockPollId })
    
    // Wrap render in act to handle Suspense/use(params)
    await act(async () => {
      render(<RegisterPage params={paramsPromise} />)
    })
    
    // Check for loading state immediately
    expect(screen.getByText('Loading poll details...')).toBeInTheDocument()
    
    // Resolve the data
    await act(async () => {
      resolvePoll({ data: mockPollData, error: null })
    })
    
    await waitFor(() => {
       expect(screen.getByText(/Test Poll/)).toBeInTheDocument()
    })
  })

  it('renders poll not found if data is missing', async () => {
    getPollById.mockResolvedValue({ data: null, error: null })
    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Poll not found')).toBeInTheDocument()
    })
  })

  it('renders registration button when not registered', async () => {
    await renderComponent()

    // Button text is "Register & Create Identity"
    await waitFor(() => {
      expect(screen.getByText('Register & Create Identity')).toBeInTheDocument()
    })
  })

  it('renders "You are registered" when already registered', async () => {
     usePollRegistry.mockReturnValue({ 
        isLoading: false,
        isRegistered: true,
        isZK: true,
        eligibilityModuleAddress: '0x123',
     })
      
     await renderComponent()

     await waitFor(() => {
       expect(screen.getByText('You are registered!')).toBeInTheDocument()
     })
  })

  it('handles successful registration flow', async () => {
    const mockIdentity = 'mock-identity'
    mockCreateIdentity.mockResolvedValue(mockIdentity)
    
    await renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Register & Create Identity')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Register & Create Identity'))

    // Wait for registration logic
    await waitFor(() => {
      expect(mockCreateIdentity).toHaveBeenCalledWith(mockPollId)
      expect(mockRegister).toHaveBeenCalledWith(mockPollId, mockIdentity)
      // Auto-download should NOT happen yet
      expect(mockDownloadIdentity).not.toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Successfully registered! You can regenerate your identity anytime by signing.')
    })

    // Verify Success UI appears
    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
      expect(screen.getByText('Download Backup (Optional)')).toBeInTheDocument()
    })

    // Click Manual Download
    fireEvent.click(screen.getByText('Download Backup (Optional)'))


    expect(mockDownloadIdentity).toHaveBeenCalledWith(mockIdentity, mockPollId)
  })

  it('shows error if wallet is not connected', async () => {
    useAccount.mockReturnValue({ address: null, isConnected: false })
    await renderComponent()

    await waitFor(() => {
        expect(screen.getByText('Register & Create Identity')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Register & Create Identity'))

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    expect(mockCreateIdentity).not.toHaveBeenCalled()
  })

  it('handles error during registration', async () => {
     const error = new Error('Registration failed')
     mockCreateIdentity.mockRejectedValue(error)
     
     await renderComponent()
     await waitFor(() => expect(screen.getByText('Register & Create Identity')).toBeInTheDocument())

     fireEvent.click(screen.getByText('Register & Create Identity'))

     await waitFor(() => {
       expect(toast.error).toHaveBeenCalledWith('Registration failed')
     })
  })

  it('handles getPollById failure', async () => {
    getPollById.mockResolvedValue({ data: null, error: 'Network error' })
    
    await renderComponent()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load poll details')
    })
  })
})
