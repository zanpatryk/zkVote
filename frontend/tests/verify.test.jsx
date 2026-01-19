import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VerifyPage from '../src/app/verify/page'
import '@testing-library/jest-dom'

// Mock sub-components
jest.mock('@/components/VoteChecker', () => ({
  __esModule: true,
  default: ({ onVerify }) => (
    <div data-testid="vote-checker">
      <button onClick={() => onVerify({
        isValid: true,
        pollId: '123',
        voteHash: '0xHash',
        timestamp: 1234567890
      })}>
        Simulate Verify
      </button>
    </div>
  ),
}))

jest.mock('@/components/VerificationResult', () => ({
  __esModule: true,
  default: ({ isValid, pollId, onReset }) => (
    <div data-testid="verification-result">
      <span>{isValid ? 'Valid Vote' : 'Invalid Vote'}</span>
      <span>Poll ID: {pollId}</span>
      <button onClick={onReset}>Verify Another</button>
    </div>
  ),
}))

jest.mock('@/components/BackButton', () => ({
    __esModule: true,
    default: () => <button>Back</button>
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('Integration Test: Verify Page', () => {
  it('renders initial state with VoteChecker', () => {
    render(<VerifyPage />)
    expect(screen.getByText('Verify Your Vote')).toBeInTheDocument()
    expect(screen.getByTestId('vote-checker')).toBeInTheDocument()
    expect(screen.queryByTestId('verification-result')).not.toBeInTheDocument()
  })

  it('transitions to VerificationResult upon successful verification', async () => {
    render(<VerifyPage />)
    
    // Simulate verification success from child component
    fireEvent.click(screen.getByText('Simulate Verify'))
    
    await waitFor(() => {
        expect(screen.getByTestId('verification-result')).toBeInTheDocument()
        expect(screen.getByText('Valid Vote')).toBeInTheDocument()
        expect(screen.getByText('Poll ID: 123')).toBeInTheDocument()
        expect(screen.queryByTestId('vote-checker')).not.toBeInTheDocument()
    })
  })

  it('can reset to verify another vote', async () => {
    render(<VerifyPage />)
    
    // Verify
    fireEvent.click(screen.getByText('Simulate Verify'))
    await waitFor(() => expect(screen.getByTestId('verification-result')).toBeInTheDocument())
    
    // Reset
    fireEvent.click(screen.getByText('Verify Another'))
    
    await waitFor(() => {
        expect(screen.getByTestId('vote-checker')).toBeInTheDocument()
        expect(screen.queryByTestId('verification-result')).not.toBeInTheDocument()
    })
  })
})
