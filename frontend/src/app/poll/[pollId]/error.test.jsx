import { render, screen } from '@testing-library/react'
import PollError from './error'

describe('PollError', () => {
  const mockReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows default poll error message', () => {
    render(<PollError error={new Error('Unknown error')} reset={mockReset} />)
    
    expect(screen.getByText('Poll Error')).toBeInTheDocument()
    expect(screen.getByText(/failed to load poll information/i)).toBeInTheDocument()
  })

  it('detects poll not found errors', () => {
    render(<PollError error={new Error('Poll not found')} reset={mockReset} />)
    
    expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument()
  })

  it('detects poll does not exist errors', () => {
    render(<PollError error={new Error('Poll does not exist')} reset={mockReset} />)
    
    expect(screen.getByText('Poll Not Found')).toBeInTheDocument()
  })

  it('detects network errors', () => {
    render(<PollError error={new Error('network request failed')} reset={mockReset} />)
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText(/unable to connect to the blockchain/i)).toBeInTheDocument()
  })

  it('detects RPC errors', () => {
    render(<PollError error={new Error('RPC timeout')} reset={mockReset} />)
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
  })

  it('detects proof generation errors', () => {
    render(<PollError error={new Error('proof verification failed')} reset={mockReset} />)
    
    expect(screen.getByText('Proof Generation Failed')).toBeInTheDocument()
    expect(screen.getByText(/failed to generate the zero-knowledge proof/i)).toBeInTheDocument()
  })

  it('detects circuit errors', () => {
    render(<PollError error={new Error('circuit not loaded')} reset={mockReset} />)
    
    expect(screen.getByText('Proof Generation Failed')).toBeInTheDocument()
  })

  it('provides reset functionality', () => {
    render(<PollError error={new Error('test')} reset={mockReset} />)
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
