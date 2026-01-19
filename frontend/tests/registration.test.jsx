import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '../src/app/poll/[pollId]/register/page'
import '@testing-library/jest-dom'
import { toast } from 'react-hot-toast'
import { useRouter, useParams } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock hooks
const mockCreateIdentity = jest.fn()
const mockRegister = jest.fn()
const mockDownloadIdentity = jest.fn()
jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: () => ({
    createIdentity: mockCreateIdentity,
    register: mockRegister,
    downloadIdentity: mockDownloadIdentity,
    isLoadingIdentity: false,
    isRegistering: false
  })
}))

const mockRefetchRegistration = jest.fn()
const mockUsePollRegistry = jest.fn()
jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: (...args) => mockUsePollRegistry(...args)
}))

// Mock blockchain read
const mockGetPollById = jest.fn()
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: (...args) => mockGetPollById(...args)
}))

// Mock Toast
jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn() }
}))

// Mock Sub Components
jest.mock('@/components/register-poll/RegistrationInstructions', () => ({
    __esModule: true,
    default: ({ onRegister }) => (
        <button onClick={onRegister}>Register Identity</button>
    )
}))

jest.mock('@/components/register-poll/RegistrationSuccess', () => ({
    __esModule: true,
    default: ({ onDownload }) => (
        <div>
            <h1>Registration Successful</h1>
            <button onClick={onDownload}>Download Identity</button>
        </div>
    )
}))

jest.mock('@/components/BackButton', () => ({
    __esModule: true,
    default: () => <div>Back</div>
}))

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>
    }
}))

describe('Integration Test: Registration Page', () => {
    const mockPush = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        
        // Configure the global mock
        useRouter.mockReturnValue({ push: mockPush })
        useParams.mockReturnValue({ pollId: '123' })
        
        mockUseAccount.mockReturnValue({ isConnected: true })
        mockUsePollRegistry.mockReturnValue({ isRegistered: false, refetchRegistration: mockRefetchRegistration })
        mockGetPollById.mockResolvedValue({ title: 'ZK Poll' })
    })

    it('renders loading state', async () => {
        // Delay poll resolution
        mockGetPollById.mockReturnValue(new Promise(() => {}))
        
        render(<RegisterPage />)
        
        // Component makes getPollById call immediately.
        // It should render "Loading poll details..." while waiting.
        expect(screen.getByText('Loading poll details...')).toBeInTheDocument()
    })

    it('renders registration instructions if not registered', async () => {
        render(<RegisterPage />)
        
        await waitFor(() => {
            expect(screen.getByText('Poll: ZK Poll')).toBeInTheDocument()
            expect(screen.getByText('Register Identity')).toBeInTheDocument()
        })
    })

    it('handles successful registration flow', async () => {
        mockCreateIdentity.mockResolvedValue({ commitment: '123' })
        mockRegister.mockResolvedValue(true)
        
        render(<RegisterPage />)
        
        await waitFor(() => expect(screen.getByText('Register Identity')).toBeInTheDocument())
        
        fireEvent.click(screen.getByText('Register Identity'))
        
        await waitFor(() => {
            expect(mockCreateIdentity).toHaveBeenCalledWith('123')
            expect(mockRegister).toHaveBeenCalledWith('123', { commitment: '123' })
            expect(mockRefetchRegistration).toHaveBeenCalled()
            
            expect(screen.getByText('Registration Successful')).toBeInTheDocument()
        })
    })

    it('renders success state if already registered', async () => {
        mockUsePollRegistry.mockReturnValue({ isRegistered: true, refetchRegistration: mockRefetchRegistration })
        
        render(<RegisterPage />)
        
        await waitFor(() => {
            expect(screen.getByText('Registration Successful')).toBeInTheDocument()
        })
    })

    it('blocks registration if wallet not connected', async () => {
        mockUseAccount.mockReturnValue({ isConnected: false })
        
        render(<RegisterPage />)
        
        await waitFor(() => expect(screen.getByText('Register Identity')).toBeInTheDocument())
        
        fireEvent.click(screen.getByText('Register Identity'))
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
            expect(mockCreateIdentity).not.toHaveBeenCalled()
        })
    })
})
