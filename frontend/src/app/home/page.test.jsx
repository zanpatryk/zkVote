import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomePage from './page'
import '@testing-library/jest-dom'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ isConnected: true })),
}))

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock alert
    window.alert = jest.fn()
  })

  it('renders default check vote tab', () => {
    render(<HomePage />)
    expect(screen.getByText('Check your vote')).toBeInTheDocument()
    expect(screen.getByText('NFT Badges')).toBeInTheDocument()
  })

  it('switches to NFT badges tab', () => {
    render(<HomePage />)
    fireEvent.click(screen.getByText('NFT Badges'))
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.queryByText('Check your vote')).not.toBeInTheDocument()
  })

  it('handles file upload and redirects on success', async () => {
    render(<HomePage />)
    
    const fileContent = 'Poll ID: 123\nVote ID: 456'
    const file = new File([fileContent], 'receipt.txt', { type: 'text/plain' })
    file.text = jest.fn().mockResolvedValue(fileContent)
    
    const input = screen.getByLabelText('Upload vote receipt')
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/poll/123/vote/check/456')
    })
  })

  it('alerts on invalid file content', async () => {
    render(<HomePage />)
    
    const fileContent = 'Invalid content'
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
