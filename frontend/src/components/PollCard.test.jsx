import { render, screen, fireEvent } from '@testing-library/react'
import PollCard from './PollCard.jsx'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import '@testing-library/jest-dom'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
  },
}))

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ address: '0x123' })),
}))

// Mock usePollRegistry
jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(() => ({
    isZK: false,
    isRegistered: false,
    merkleTreeDepth: 0,
    eligibilityModuleAddress: '0x000'
  }))
}))

// Mock useSemaphore
jest.mock('@/hooks/useSemaphore', () => ({
  useSemaphore: jest.fn(() => ({
    createIdentity: jest.fn(),
    register: jest.fn(),
    isLoadingIdentity: false,
    isRegistering: false,
  })),
}))

// Mock viem
jest.mock('viem', () => ({
  hexToString: jest.fn((hex) => hex),
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

  it('shows Mint Result NFT link for Ended poll (state 2)', () => {
    render(<PollCard {...defaultProps} state={2} />)
    expect(screen.getByText('Mint Result NFT')).toBeInTheDocument()
    expect(screen.getByText('View Details')).toBeInTheDocument()
  })

  it('shows owner badge when isOwner is true', () => {
    render(<PollCard {...defaultProps} isOwner={true} />)
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('does not show owner badge when isOwner is false', () => {
    render(<PollCard {...defaultProps} isOwner={false} />)
    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
  })

  it('shows registered badge when user is registered', () => {
    usePollRegistry.mockReturnValue({
      isZK: true,
      isRegistered: true,
      merkleTreeDepth: 20,
      eligibilityModuleAddress: '0x123'
    })
    render(<PollCard {...defaultProps} />)
    expect(screen.getByText('Registered')).toBeInTheDocument()
  })

  it('shows Manage Poll link for owner', () => {
    render(<PollCard {...defaultProps} isOwner={true} />)
    const manageLink = screen.getByText('Manage Poll').closest('a')
    expect(manageLink).toHaveAttribute('href', `/poll/${defaultProps.pollId}/manage`)
  })

  it('shows View Details link for non-owner', () => {
    render(<PollCard {...defaultProps} isOwner={false} />)
    const viewLink = screen.getByText('View Details').closest('a')
    expect(viewLink).toHaveAttribute('href', `/poll/${defaultProps.pollId}`)
  })

  it('shows vote button when showVoteButton is true and state is Active (1) and user is registered', () => {
    usePollRegistry.mockReturnValue({
      isZK: true,
      isRegistered: true,
      merkleTreeDepth: 20,
      eligibilityModuleAddress: '0x123'
    })
    // Must be Active (1) to show vote button
    render(<PollCard {...defaultProps} state={1} showVoteButton={true} />)
    expect(screen.getByText('Vote Now')).toBeInTheDocument()
  })

  it('does not show vote button when active but user is NOT registered', () => {
    usePollRegistry.mockReturnValue({
      isZK: true,
      isRegistered: false,
      merkleTreeDepth: 20,
      eligibilityModuleAddress: '0x123'
    })
    render(<PollCard {...defaultProps} state={1} showVoteButton={true} />)
    expect(screen.queryByText('Vote Now')).not.toBeInTheDocument()
  })

  it('does not show vote button when state is Created (0) even if showVoteButton is true', () => {
    render(<PollCard {...defaultProps} state={0} showVoteButton={true} />)
    expect(screen.queryByText('Vote Now')).not.toBeInTheDocument()
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


})
