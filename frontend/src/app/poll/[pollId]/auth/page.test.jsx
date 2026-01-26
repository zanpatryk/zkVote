import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import PollAuthPage from './page'
import '@testing-library/jest-dom'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { usePollRegistry } from '@/hooks/usePollRegistry'
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
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: jest.fn(),
}))

jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn(),
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

// Mock IdentityFileUploader to avoid testing its internal logic deeply here
jest.mock('@/components/IdentityFileUploader', () => {
    return function MockUploader({ onIdentityParsed }) {
      return (
        <div>
            <button 
              onClick={() => onIdentityParsed({ identity: { commitment: '123' }, pollId: '123' })}
              data-testid="mock-uploader"
            >
              Mock Upload Success
            </button>
            <button 
              onClick={() => onIdentityParsed({ identity: { commitment: '123' }, pollId: '999' })}
              data-testid="mock-uploader-fail"
            >
              Mock Upload Fail
            </button>
        </div>
      )
    }
})

describe('PollAuthPage', () => {
  const mockRouter = { push: jest.fn(), replace: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: '123' })
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ address: '0xUser', isConnected: true })
    
    useSemaphore.mockReturnValue({
        createIdentity: jest.fn(),
        isLoadingIdentity: false,
    })

    usePollRegistry.mockReturnValue({ isZK: true, isLoading: false })
  })

  it('renders authentication options', () => {
    render(<PollAuthPage />)
    expect(screen.getByText('Authenticate to Vote')).toBeInTheDocument()
    expect(screen.getByText('Sign with Wallet')).toBeInTheDocument()
    expect(screen.getByTestId('mock-uploader')).toBeInTheDocument()
  })

  it('calls createIdentity and redirects on sign', async () => {
    const mockCreateIdentity = jest.fn().mockResolvedValue({ commitment: '123' })
    useSemaphore.mockReturnValue({
        createIdentity: mockCreateIdentity,
        isLoadingIdentity: false,
    })

    render(<PollAuthPage />)
    
    fireEvent.click(screen.getByText('Sign & Enter'))
    
    await waitFor(() => {
        expect(mockCreateIdentity).toHaveBeenCalledWith('123')
        expect(mockSetIdentity).toHaveBeenCalledWith({ commitment: '123' }, '123')
        expect(mockRouter.push).toHaveBeenCalledWith('/poll/123/vote')
    })
  })

  it('handles successful file upload via callback', async () => {
    render(<PollAuthPage />)
    
    fireEvent.click(screen.getByTestId('mock-uploader'))
    
    await waitFor(() => {
        expect(mockSetIdentity).toHaveBeenCalledWith({ commitment: '123' }, '123')
        expect(mockRouter.push).toHaveBeenCalledWith('/poll/123/vote')
    })
  })

  it('shows error if upload has wrong pollId', async () => {
    render(<PollAuthPage />)
    
    // Click the failure button which sends pollId: '999' (mismatch with '123')
    fireEvent.click(screen.getByTestId('mock-uploader-fail'))
    
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Poll #999'))
        expect(mockSetIdentity).not.toHaveBeenCalled()
    })
  })

  it('redirects to vote page if poll is not anonymous (not isZK)', async () => {
    usePollRegistry.mockReturnValue({ isZK: false, isLoading: false })
    
    render(<PollAuthPage />)
    
    await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/poll/123/vote')
    })
  })
})
