import { render, screen, waitFor } from '@testing-library/react'
import VoteUploadPage from './page'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

// Mock IdentityTransferContext
const mockSetIdentity = jest.fn()
jest.mock('@/lib/providers/IdentityTransferContext', () => ({
  useIdentityTransfer: () => ({
    setIdentity: mockSetIdentity,
  })
}))

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}))

jest.mock('@/components/BackButton', () => {
    return function MockBackButton({ href, label }) {
      return <a href={href}>{label}</a>
    }
})

// Mock IdentityFileUploader
jest.mock('@/components/IdentityFileUploader', () => {
    return function MockUploader({ onIdentityParsed }) {
      return (
        <button 
          onClick={() => onIdentityParsed({ identity: { commitment: '123' }, pollId: '456' })}
          data-testid="mock-uploader"
        >
          Mock Upload
        </button>
      )
    }
})

describe('VoteUploadPage', () => {
  const mockRouter = { push: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
  })

  it('renders page content', () => {
    render(<VoteUploadPage />)
    expect(screen.getByText('Vote with Identity File')).toBeInTheDocument()
    expect(screen.getByText('Back to Voting')).toBeInTheDocument()
    expect(screen.getByTestId('mock-uploader')).toBeInTheDocument()
  })

  it('handles successful file upload via callback', async () => {
    render(<VoteUploadPage />)
    
    // Simulate upload
    screen.getByTestId('mock-uploader').click()
    
    await waitFor(() => {
        expect(mockSetIdentity).toHaveBeenCalledWith({ commitment: '123' }, '456')
        expect(toast.success).toHaveBeenCalledWith('Identity loaded! Redirecting...')
    })
    
    // Redirect happens after timeout
    await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/poll/456/vote')
    }, { timeout: 1500 })
  })
})
