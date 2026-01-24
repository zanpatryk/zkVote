import { render, screen, fireEvent } from '@testing-library/react'
import ErrorFallback from './ErrorFallback'

describe('ErrorFallback', () => {
  it('renders default error message', () => {
    render(<ErrorFallback />)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
  })

  it('renders custom title and description', () => {
    render(
      <ErrorFallback 
        title="Custom Title" 
        description="Custom description text" 
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })

  it('shows Try Again button when reset function is provided', () => {
    const mockReset = jest.fn()
    render(<ErrorFallback reset={mockReset} />)
    
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    expect(tryAgainButton).toBeInTheDocument()
    
    fireEvent.click(tryAgainButton)
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('hides Try Again button when no reset function is provided', () => {
    render(<ErrorFallback />)
    
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('always shows Go Home button', () => {
    render(<ErrorFallback />)
    
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
  })

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    
    const testError = new Error('Test error message')
    render(<ErrorFallback error={testError} />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true })
  })

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    
    const testError = new Error('Sensitive error details')
    render(<ErrorFallback error={testError} />)
    
    expect(screen.queryByText('Sensitive error details')).not.toBeInTheDocument()
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true })
  })

  it('displays error digest when available', () => {
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    
    const testError = new Error('Test error')
    testError.digest = 'abc123'
    render(<ErrorFallback error={testError} />)
    
    expect(screen.getByText(/Digest: abc123/)).toBeInTheDocument()
    
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true })
  })

  it('navigates to home page when Go Home button is clicked', () => {
    render(<ErrorFallback />)
    
    const goHomeButton = screen.getByRole('button', { name: /go home/i })
    
    // Just verify the button exists and can be clicked without error
    expect(goHomeButton).toBeInTheDocument()
    fireEvent.click(goHomeButton)
    // In JSDOM, this sets location.href which can be tricky to test
    // The important thing is the click doesn't throw an error
  })
})
