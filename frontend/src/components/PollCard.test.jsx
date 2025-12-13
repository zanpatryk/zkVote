import { render, screen, fireEvent } from '@testing-library/react'
import PollCard, { formatDuration } from './PollCard.jsx'
import '@testing-library/jest-dom'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
  },
}))

// Mock viem
jest.mock('viem', () => ({
  hexToString: jest.fn((hex) => hex), // Simple mock, or implement if needed
}))

describe('PollCard', () => {
  const defaultProps = {
    pollId: 123456789n,
    title: 'Test Poll',
    state: 0, // Created
    isOwner: false,
    showVoteButton: false,
  }

  it('renders full ID for short IDs (length <= 8)', () => {
    const shortIdProps = { ...defaultProps, pollId: 12345678n } // Length 8
    render(<PollCard {...shortIdProps} />)
    expect(screen.getByText('ID: 12345678')).toBeInTheDocument()
  })

  it('renders truncated ID for long IDs (length >= 9)', () => {
    const longIdProps = { ...defaultProps, pollId: 123456789n } // Length 9
    render(<PollCard {...longIdProps} />)
    expect(screen.getByText(/ID: 1234...6789/)).toBeInTheDocument()
  })

  it('renders correct status label', () => {
    const { rerender } = render(<PollCard {...defaultProps} state={0} />)
    expect(screen.getByText('Created')).toBeInTheDocument()

    rerender(<PollCard {...defaultProps} state={1} />)
    expect(screen.getByText('Active')).toBeInTheDocument()

    rerender(<PollCard {...defaultProps} state={2} />)
    expect(screen.getByText('Ended')).toBeInTheDocument()
  })

  it('shows owner badge when isOwner is true', () => {
    render(<PollCard {...defaultProps} isOwner={true} />)
    expect(screen.getByText('OWNER')).toBeInTheDocument()
  })

  it('does not show owner badge when isOwner is false', () => {
    render(<PollCard {...defaultProps} isOwner={false} />)
    expect(screen.queryByText('OWNER')).not.toBeInTheDocument()
  })

  it('shows Manage Poll link for owner', () => {
    render(<PollCard {...defaultProps} isOwner={true} />)
    const manageLink = screen.getByText('Manage Poll →').closest('a')
    expect(manageLink).toHaveAttribute('href', `/poll/${defaultProps.pollId}/manage`)
  })

  it('shows View Details link for non-owner', () => {
    render(<PollCard {...defaultProps} isOwner={false} />)
    const viewLink = screen.getByText('View Details →').closest('a')
    expect(viewLink).toHaveAttribute('href', `/poll/${defaultProps.pollId}`)
  })

  it('shows vote button when showVoteButton is true', () => {
    render(<PollCard {...defaultProps} showVoteButton={true} />)
    expect(screen.getByText('Vote →')).toBeInTheDocument()
  })

  it('copies poll ID to clipboard on click', () => {
    // Mock clipboard
    const writeTextMock = jest.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<PollCard {...defaultProps} />)
    
    const copyButton = screen.getByTitle('Copy Poll ID')
    fireEvent.click(copyButton)

    expect(writeTextMock).toHaveBeenCalledWith('123456789')
  })

  describe('formatDuration', () => {
    it('formats 0 or negative ms as 0m', () => {
      expect(formatDuration(0)).toBe('0m')
      expect(formatDuration(-100)).toBe('0m')
    })

    it('formats minutes correctly', () => {
      expect(formatDuration(60 * 1000)).toBe('1m')
      expect(formatDuration(5 * 60 * 1000)).toBe('5m')
    })

    it('formats hours correctly', () => {
      expect(formatDuration(60 * 60 * 1000)).toBe('1h')
      expect(formatDuration(2 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('2h 30m')
    })

    it('formats days correctly', () => {
      expect(formatDuration(24 * 60 * 60 * 1000)).toBe('1d')
      expect(formatDuration(2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000)).toBe('2d 5h')
    })
  })
})
