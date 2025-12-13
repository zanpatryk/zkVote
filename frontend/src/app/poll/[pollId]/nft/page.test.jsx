import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import MintNFTPage from './page'
import * as read from '@/lib/blockchain/engine/read'
import * as write from '@/lib/blockchain/engine/write'
import * as wagmi from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
  isUserWhitelisted: jest.fn(),
  getUserNFTs: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  mintResultNFT: jest.fn(),
}))

jest.mock('@/components/PollDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="poll-details">Poll Details Component</div>,
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

describe('MintNFTPage', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockPollId = '123'
  const mockUserAddress = '0xUser'

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush, replace: mockReplace })
    useParams.mockReturnValue({ pollId: mockPollId })
    // Default: not minted
    read.getUserNFTs.mockResolvedValue([])
  })

  it('redirects if wallet not connected', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    read.getPollById.mockReturnValue(new Promise(() => {})) // Pending
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })

  it('redirects if poll is not ended (state != 2)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ state: 1, creator: '0xOther' }) // Active
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/poll/${mockPollId}`)
    })
  })

  it('shows not authorized if not owner and not whitelisted', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ state: 2, creator: '0xOther' }) // Ended
    read.isUserWhitelisted.mockResolvedValue(false)
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Not Authorized')).toBeInTheDocument()
    })
  })

  it('shows mint button if owner (and not minted)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ state: 2, creator: mockUserAddress.toLowerCase() }) // Ended, Owner
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
      expect(screen.queryByTestId('poll-details')).not.toBeInTheDocument()
    })
  })

  it('shows mint button if whitelisted (and not minted)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ state: 2, creator: '0xOther' }) // Ended
    read.isUserWhitelisted.mockResolvedValue(true)
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
      expect(screen.queryByTestId('poll-details')).not.toBeInTheDocument()
    })
  })

  it('calls mintResultNFT when button clicked and shows results', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ state: 2, creator: mockUserAddress.toLowerCase() })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: 'Mint Result NFT' })
    fireEvent.click(button)

    expect(screen.getByText('Minting...')).toBeInTheDocument()
    await waitFor(() => {
      expect(write.mintResultNFT).toHaveBeenCalledWith(mockPollId)
      // Results appear after success
      expect(screen.getByText('✓ NFT Badge Minted')).toBeInTheDocument()
      expect(screen.getByTestId('poll-details')).toBeInTheDocument()
    })
  })

  it('shows results immediately if already minted', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ state: 2, creator: mockUserAddress.toLowerCase() })
    read.getUserNFTs.mockResolvedValue([{ name: `Poll #${mockPollId} Results` }])

    render(<MintNFTPage />)

    await waitFor(() => {
        expect(screen.getByText('✓ NFT Badge Minted')).toBeInTheDocument()
        expect(screen.getByTestId('poll-details')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Mint Result NFT' })).not.toBeInTheDocument()
    })
  })
})
