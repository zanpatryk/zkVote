import { render, screen } from '@testing-library/react'
import ManageError from './error'

describe('ManageError', () => {
  const mockReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows default management error message', () => {
    render(<ManageError error={new Error('Unknown error')} reset={mockReset} />)
    
    expect(screen.getByText('Management Error')).toBeInTheDocument()
    expect(screen.getByText(/failed to manage this poll/i)).toBeInTheDocument()
  })

  it('detects decryption errors', () => {
    render(<ManageError error={new Error('Failed to decrypt votes')} reset={mockReset} />)
    
    expect(screen.getByText('Decryption Failed')).toBeInTheDocument()
    expect(screen.getByText(/correct private key/i)).toBeInTheDocument()
  })

  it('detects private key errors', () => {
    render(<ManageError error={new Error('Invalid private key')} reset={mockReset} />)
    
    expect(screen.getByText('Decryption Failed')).toBeInTheDocument()
  })

  it('detects proof generation errors', () => {
    render(<ManageError error={new Error('proof generation failed')} reset={mockReset} />)
    
    expect(screen.getByText('Proof Generation Failed')).toBeInTheDocument()
    expect(screen.getByText(/decryption proof/i)).toBeInTheDocument()
  })

  it('detects circuit errors', () => {
    render(<ManageError error={new Error('circuit file missing')} reset={mockReset} />)
    
    expect(screen.getByText('Proof Generation Failed')).toBeInTheDocument()
  })

  it('detects publish errors', () => {
    render(<ManageError error={new Error('Failed to publish results')} reset={mockReset} />)
    
    expect(screen.getByText('Publishing Failed')).toBeInTheDocument()
    expect(screen.getByText(/publish the results on-chain/i)).toBeInTheDocument()
  })

  it('detects tally errors', () => {
    render(<ManageError error={new Error('tally submission failed')} reset={mockReset} />)
    
    expect(screen.getByText('Publishing Failed')).toBeInTheDocument()
  })

  it('detects unauthorized errors', () => {
    render(<ManageError error={new Error('Not the owner of this poll')} reset={mockReset} />)
    
    expect(screen.getByText('Unauthorized')).toBeInTheDocument()
    expect(screen.getByText(/only the poll owner/i)).toBeInTheDocument()
  })

  it('detects unauthorized by keyword', () => {
    render(<ManageError error={new Error('unauthorized access')} reset={mockReset} />)
    
    expect(screen.getByText('Unauthorized')).toBeInTheDocument()
  })

  it('detects poll not ended errors', () => {
    render(<ManageError error={new Error('Poll not ended yet')} reset={mockReset} />)
    
    expect(screen.getByText('Poll Still Active')).toBeInTheDocument()
    expect(screen.getByText(/after the poll has ended/i)).toBeInTheDocument()
  })

  it('detects still active errors', () => {
    render(<ManageError error={new Error('Poll still active')} reset={mockReset} />)
    
    expect(screen.getByText('Poll Still Active')).toBeInTheDocument()
  })

  it('provides reset functionality', () => {
    render(<ManageError error={new Error('test')} reset={mockReset} />)
    
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
