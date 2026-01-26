import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterPage from '../src/app/poll/[pollId]/register/page'
import '@testing-library/jest-dom'
import { toast } from 'react-hot-toast'
import { useRouter, useParams } from 'next/navigation'
import { useRegistrationFlow } from '../src/hooks/useRegistrationFlow'
import React from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('../src/hooks/useRegistrationFlow', () => ({
  useRegistrationFlow: jest.fn(),
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
    const mockPollId = '123'
    const mockHandleRegister = jest.fn()
    const mockDownloadIdentity = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        
        useParams.mockReturnValue({ pollId: mockPollId })
        
        // Default: eligible, not registered
        useRegistrationFlow.mockReturnValue({
            poll: { title: 'ZK Poll' },
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

    it('renders registration instructions if not registered', async () => {
        render(<RegisterPage />)
        
        await waitFor(() => {
            expect(screen.getByText('Poll: ZK Poll')).toBeInTheDocument()
            expect(screen.getByText('Register Identity')).toBeInTheDocument()
        })
    })

    it('handles successful registration flow (UI state transition)', async () => {
        const { rerender } = render(<RegisterPage />)
        
        await waitFor(() => expect(screen.getByText('Register Identity')).toBeInTheDocument())
        
        fireEvent.click(screen.getByText('Register Identity'))
        expect(mockHandleRegister).toHaveBeenCalled()

        // Simulate success by updating hook return
        useRegistrationFlow.mockReturnValue({
            poll: { title: 'ZK Poll' },
            pollId: mockPollId,
            isRegistered: false,
            registeredIdentity: { commitment: '123' },
            isLoading: false,
            isLoadingIdentity: false,
            isRegistering: false,
            error: null,
            handleRegister: mockHandleRegister,
            downloadIdentity: mockDownloadIdentity
        })

        rerender(<RegisterPage />)
        
        await waitFor(() => {
            expect(screen.getByText('Registration Successful')).toBeInTheDocument()
        })
    })

    it('renders success state if already registered', async () => {
        useRegistrationFlow.mockReturnValue({
            poll: { title: 'ZK Poll' },
            pollId: mockPollId,
            isRegistered: true,
            registeredIdentity: null,
            isLoading: false,
            error: null,
            downloadIdentity: mockDownloadIdentity
        })
        
        render(<RegisterPage />)
        
        await waitFor(() => {
            expect(screen.getByText('Registration Successful')).toBeInTheDocument()
        })
    })
})
