import { render, screen } from '@testing-library/react'
import RegisterError from './error'

describe('RegisterError', () => {
  const mockReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows default registration error message', () => {
    render(<RegisterError error={new Error('Unknown error')} reset={mockReset} />)
    
    expect(screen.getByText('Registration Error')).toBeInTheDocument()
    expect(screen.getByText(/failed to register for this poll/i)).toBeInTheDocument()
  })

  it('detects identity errors', () => {
    render(<RegisterError error={new Error('Failed to create identity')} reset={mockReset} />)
    
    expect(screen.getByText('Identity Error')).toBeInTheDocument()
    expect(screen.getByText(/anonymous identity/i)).toBeInTheDocument()
  })

  it('detects commitment errors', () => {
    render(<RegisterError error={new Error('Invalid commitment hash')} reset={mockReset} />)
    
    expect(screen.getByText('Identity Error')).toBeInTheDocument()
  })

  it('detects already registered errors', () => {
    render(<RegisterError error={new Error('User already registered')} reset={mockReset} />)
    
    expect(screen.getByText('Already Registered')).toBeInTheDocument()
    expect(screen.getByText(/already registered for this poll/i)).toBeInTheDocument()
  })

  it('detects already a member errors', () => {
    render(<RegisterError error={new Error('already a member of group')} reset={mockReset} />)
    
    expect(screen.getByText('Already Registered')).toBeInTheDocument()
  })

  it('detects whitelist errors', () => {
    render(<RegisterError error={new Error('Not on whitelist')} reset={mockReset} />)
    
    expect(screen.getByText('Not Whitelisted')).toBeInTheDocument()
    expect(screen.getByText(/must be whitelisted/i)).toBeInTheDocument()
  })

  it('detects registration closed errors', () => {
    render(<RegisterError error={new Error('poll not accepting registrations')} reset={mockReset} />)
    
    expect(screen.getByText('Registration Closed')).toBeInTheDocument()
    expect(screen.getByText(/not currently accepting registrations/i)).toBeInTheDocument()
  })

  it('provides reset functionality', () => {
    render(<RegisterError error={new Error('test')} reset={mockReset} />)
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
