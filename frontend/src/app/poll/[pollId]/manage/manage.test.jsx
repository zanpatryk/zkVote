import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ManagePollPage from './page'
import * as read from '@/lib/blockchain/engine/read'
import * as wagmi from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
}))

jest.mock('@/components/PollDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="poll-details">Poll Details Component</div>,
}))

jest.mock('@/components/WhitelistManager', () => ({
  __esModule: true,
  default: () => <div data-testid="whitelist-manager">Whitelist Manager Component</div>,
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

  it('renders management view if owner', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ creator: mockUserAddress.toLowerCase() }) // Is owner

    render(<ManagePollPage />)

    await waitFor(() => {
      expect(screen.getByText('Manage Poll')).toBeInTheDocument()
      expect(screen.getByTestId('poll-details')).toBeInTheDocument()
      expect(screen.getByTestId('whitelist-manager')).toBeInTheDocument()
    })
  })
})
