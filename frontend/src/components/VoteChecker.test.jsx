import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoteChecker from './VoteChecker'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('VoteChecker', () => {
  const mockOnVerify = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<VoteChecker onVerify={mockOnVerify} />)
    expect(screen.getByText('Upload Receipt')).toBeInTheDocument()
    expect(screen.getByLabelText('Upload vote receipt')).toBeInTheDocument()
  })

  it('handles valid JSON file upload with all fields', async () => {
    render(<VoteChecker onVerify={mockOnVerify} />)

    const receiptData = {
      pollId: '12345',
      voteId: '67890',
      txHash: '0xabc123',
      nullifier: 'nullifier123',
      proof: '[1,2,3]'
    }
    const fileContent = JSON.stringify(receiptData)
    const file = new File([fileContent], 'receipt.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith(receiptData)
    })
  })
  
  it('handles valid JSON file upload with minimal fields', async () => {
    render(<VoteChecker onVerify={mockOnVerify} />)

    const receiptData = { pollId: '12345', voteId: '67890' }
    const fileContent = JSON.stringify(receiptData)
    const file = new File([fileContent], 'receipt.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith(receiptData)
    })
  })

  it('alerts on invalid JSON file', async () => {
    window.alert = jest.fn()
    render(<VoteChecker />)

    const fileContent = 'Invalid Content'
    const file = new File([fileContent], 'receipt.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid receipt file. Please upload a valid zkVote receipt (.json).')
      expect(mockOnVerify).not.toHaveBeenCalled()
    })
  })

  it('alerts when required fields are missing', async () => {
    window.alert = jest.fn()
    render(<VoteChecker />)

    const receiptData = { pollId: '12345' } // missing voteId
    const fileContent = JSON.stringify(receiptData)
    const file = new File([fileContent], 'receipt.json', { type: 'application/json' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Invalid receipt file. Please upload a valid zkVote receipt (.json).')
      expect(mockOnVerify).not.toHaveBeenCalled()
    })
  })
})
