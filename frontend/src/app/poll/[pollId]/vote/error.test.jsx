import { render, screen } from '@testing-library/react'
import VotingError from './error'

describe('VotingError', () => {
  const mockReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows default voting error message', () => {
    render(<VotingError error={new Error('Unknown error')} reset={mockReset} />)
    
    expect(screen.getByText('Voting Error')).toBeInTheDocument()
    expect(screen.getByText(/failed to process your vote/i)).toBeInTheDocument()
  })

  it('detects proof generation errors', () => {
    render(<VotingError error={new Error('Failed to generate proof')} reset={mockReset} />)
    
    expect(screen.getByText('Proof Generation Failed')).toBeInTheDocument()
    expect(screen.getByText(/anonymous voting proof/i)).toBeInTheDocument()
  })

  it('detects circuit-related errors', () => {
    render(<VotingError error={new Error('circuit file not found')} reset={mockReset} />)
    
    expect(screen.getByText('Proof Generation Failed')).toBeInTheDocument()
  })

  it('detects already voted errors by message', () => {
    render(<VotingError error={new Error('User already voted')} reset={mockReset} />)
    
    expect(screen.getByText('Already Voted')).toBeInTheDocument()
    expect(screen.getByText(/already cast a vote/i)).toBeInTheDocument()
  })

  it('detects already voted errors by error code', () => {
    render(<VotingError error={new Error('reverted: 0xaef0604b')} reset={mockReset} />)
    
    expect(screen.getByText('Already Voted')).toBeInTheDocument()
  })

  it('detects eligibility errors', () => {
    render(<VotingError error={new Error('User not eligible')} reset={mockReset} />)
    
    expect(screen.getByText('Not Eligible')).toBeInTheDocument()
    expect(screen.getByText(/not eligible to vote/i)).toBeInTheDocument()
  })

  it('detects whitelist errors', () => {
    render(<VotingError error={new Error('Not on whitelist')} reset={mockReset} />)
    
    expect(screen.getByText('Not Eligible')).toBeInTheDocument()
  })

  it('provides reset functionality', () => {
    render(<VotingError error={new Error('test')} reset={mockReset} />)
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
