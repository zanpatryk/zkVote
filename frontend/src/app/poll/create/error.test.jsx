
import { render, screen } from '@testing-library/react'
import CreatePollError from './error'

// Mock the ErrorFallback component
jest.mock('@/components/ErrorFallback', () => {
  return function MockErrorFallback({ title, description, reset }) {
    return (
      <div data-testid="error-fallback">
        <h1>{title}</h1>
        <p>{description}</p>
        <button onClick={reset}>Try again</button>
      </div>
    )
  }
})

describe('CreatePollError', () => {
  const mockReset = jest.fn()
  const defaultProps = {
    error: new Error('Something went wrong'),
    reset: mockReset,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders default error message for generic errors', () => {
    render(<CreatePollError {...defaultProps} />)
    
    expect(screen.getByText('Creation Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to create your poll. Please try again.')).toBeInTheDocument()
  })

  it('renders wallet connection error message', () => {
    const props = {
      ...defaultProps,
      error: new Error('User rejected wallet connection request'),
    }
    render(<CreatePollError {...props} />)
    
    expect(screen.getByText('Wallet Not Connected')).toBeInTheDocument()
    expect(screen.getByText('Please connect your wallet to create a poll.')).toBeInTheDocument()
  })

  it('renders wallet connection error message for "connect" keyword', () => {
    const props = {
      ...defaultProps,
      error: new Error('Failed to connect to provider'),
    }
    render(<CreatePollError {...props} />)
    
    expect(screen.getByText('Wallet Not Connected')).toBeInTheDocument()
  })

  it('renders insufficient funds error message', () => {
    const props = {
      ...defaultProps,
      error: new Error('Insufficient funds for gas * price + value'),
    }
    render(<CreatePollError {...props} />)
    
    expect(screen.getByText('Insufficient Funds')).toBeInTheDocument()
    expect(screen.getByText('You need ETH to pay for transaction fees.')).toBeInTheDocument()
  })

  it('passes reset function to ErrorFallback', () => {
    render(<CreatePollError {...defaultProps} />)
    
    const resetButton = screen.getByText('Try again')
    resetButton.click()
    
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('handles null error object gracefully', () => {
    render(<CreatePollError error={null} reset={mockReset} />)
    
    expect(screen.getByText('Creation Failed')).toBeInTheDocument()
    expect(screen.getByText('Failed to create your poll. Please try again.')).toBeInTheDocument()
  })
})
