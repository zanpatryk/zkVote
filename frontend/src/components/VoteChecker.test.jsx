import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoteChecker from './VoteChecker'
import { useRouter } from 'next/navigation'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('VoteChecker', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
  })

  it('renders correctly', () => {
    render(<VoteChecker />)
    expect(screen.getByText('Check your vote')).toBeInTheDocument()
    expect(screen.getByLabelText('Upload vote receipt')).toBeInTheDocument()
  })

  it('handles valid file upload with Tx Hash', async () => {
    render(<VoteChecker />)

    const fileContent = 'zkVote Receipt\nPoll ID: 12345\nVote ID: 67890\nTx Hash: 0xabc123'
    const file = new File([fileContent], 'receipt.txt', { type: 'text/plain' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/poll/12345/vote/check/67890?txHash=0xabc123')
    })
  })
  
  it('handles valid file upload without Tx Hash', async () => {
    render(<VoteChecker />)

    const fileContent = 'Poll ID: 12345\nVote ID: 67890'
    const file = new File([fileContent], 'receipt.txt', { type: 'text/plain' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/poll/12345/vote/check/67890')
    })
  })

  it('alerts on invalid file content', async () => {
    window.alert = jest.fn()
    render(<VoteChecker />)

    const fileContent = 'Invalid Content'
    const file = new File([fileContent], 'receipt.txt', { type: 'text/plain' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    const input = screen.getByLabelText('Upload vote receipt')

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Could not read poll and vote IDs from this receipt file.')
        expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
