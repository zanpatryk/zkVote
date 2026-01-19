import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ManagePollPage from './page'
import * as read from '@/lib/blockchain/engine/read'
import * as wagmi from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  getMerkleTreeDepth: jest.fn().mockResolvedValue(20),
}))

jest.mock('@/components/PollDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="poll-details">Poll Details Component</div>,
}))

jest.mock('@/components/WhitelistManager', () => ({
  __esModule: true,
  default: () => <div data-testid="whitelist-manager">Whitelist Manager Component</div>,
}))

jest.mock('@/components/WhitelistedAddressesList', () => ({
  __esModule: true,
  default: () => <div data-testid="whitelisted-addresses-list">Whitelisted Addresses List Component</div>,
}))

jest.mock('@/components/VotesList', () => ({
  __esModule: true,
  default: () => <div data-testid="votes-list">Votes List Component</div>,
}))

jest.mock('@/components/RegistrationList', () => ({
  __esModule: true,
  default: () => <div data-testid="registration-list">Registration List Component</div>,
}))

jest.mock('@/components/PollStatusManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="poll-status-manager">Poll Status Manager Component</div>,
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn() },
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('@/components/TallyManager', () => {
  return function DummyTallyManager() {
    return <div data-testid="tally-manager">Tally Manager</div>
  }
})

jest.mock('@/components/TallyManager', () => {
  return function DummyTallyManager() {
    return <div data-testid="tally-manager">Tally Manager</div>
  }
})

describe('ManagePollPage', () => {
  const mockPush = jest.fn()
  const mockPollId = '123'
  const mockUserAddress = '0xUser'

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
    useParams.mockReturnValue({ pollId: mockPollId })
  })

  it('renders loading state initially', () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    // getPollById does not resolve immediately
    read.getPollById.mockReturnValue(new Promise(() => {}))
    
    render(<ManagePollPage />)
    expect(screen.getByText('Verifying ownership...')).toBeInTheDocument()
  })

  it('redirects if wallet not connected', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    render(<ManagePollPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('Please connect your wallet to manage this poll.')).toBeInTheDocument()
    })
  })

  it('shows access denied if not owner', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ creator: '0xOther' }) // Not owner

    render(<ManagePollPage />)

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('You are not the owner of this poll.')).toBeInTheDocument()
    })

    const link = screen.getByText('View Poll Details')
    fireEvent.click(link)
    expect(mockPush).toHaveBeenCalledWith(`/poll/${mockPollId}`)
  })

  it('renders management view with tabs if owner', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ creator: mockUserAddress.toLowerCase(), state: 0 }) // Is owner

    render(<ManagePollPage />)

    // Initial State: Poll Details Tab
    await waitFor(() => {
      expect(screen.getByText('Manage Poll')).toBeInTheDocument()
      expect(screen.getByTestId('poll-details')).toBeInTheDocument()
      expect(screen.getByTestId('poll-status-manager')).toBeInTheDocument()
      // Whitelist manager should NOT be visible yet
      expect(screen.queryByTestId('whitelist-manager')).not.toBeInTheDocument()
    })
    
    // Switch to Whitelisting Tab
    fireEvent.click(screen.getByText('Whitelisting'))
    
    await waitFor(() => {
        expect(screen.getByTestId('whitelist-manager')).toBeInTheDocument()
        expect(screen.getByTestId('whitelisted-addresses-list')).toBeInTheDocument()
        // Poll details should be hidden
        expect(screen.queryByTestId('poll-details')).not.toBeInTheDocument()
    })

    // Switch to Votes Tab
    fireEvent.click(screen.getByText('Votes'))

    await waitFor(() => {
        expect(screen.getByTestId('votes-list')).toBeInTheDocument()
        // Whitelist manager should be hidden
        expect(screen.queryByTestId('whitelist-manager')).not.toBeInTheDocument()
    })
  })
})
