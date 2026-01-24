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
  getZKPollState: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  mintResultNFT: jest.fn(),
}))

// Mock the useUserNFTs hook
const mockRefetchNFTs = jest.fn()
jest.mock('@/hooks/useUserNFTs', () => ({
  useUserNFTs: jest.fn(),
}))

import { useUserNFTs } from '@/hooks/useUserNFTs'

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
    // Default: not minted (empty NFTs)
    useUserNFTs.mockReturnValue({ nfts: [], isLoading: false, error: null, refetch: mockRefetchNFTs })
    read.getZKPollState.mockResolvedValue({ data: { resultsPublished: true }, error: null })
  })

  it('renders connection error state', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: null, error: 'Network Error' })

    render(<MintNFTPage />)

    await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
        expect(screen.getByText(/Could not connect to the network/i)).toBeInTheDocument()
    })
  })

  it('redirects if wallet not connected', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    read.getPollById.mockReturnValue(new Promise(() => {})) // Pending
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })

  it('renders connection error if whitelist check fails', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    // Not owner, so it proceeds to check whitelist
    read.getPollById.mockResolvedValue({ data: { state: 2, creator: '0xOther' }, error: null })
    read.isUserWhitelisted.mockResolvedValue({ data: false, error: 'Network Error' })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
        expect(screen.getByText(/Could not connect to the network/i)).toBeInTheDocument()
    })
  })

  it('redirects if poll is not ended (state != 2)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: { state: 1, creator: '0xOther' }, error: null }) // Active
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/poll/${mockPollId}`)
    })
  })

  it('shows not authorized if not owner and not whitelisted', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: { state: 2, creator: '0xOther' }, error: null }) // Ended
    read.isUserWhitelisted.mockResolvedValue({ data: false, error: null })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Not Authorized')).toBeInTheDocument()
    })
  })

  it('shows mint button if owner (and not minted)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: { state: 2, creator: mockUserAddress.toLowerCase() }, error: null }) // Ended, Owner
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
      expect(screen.queryByTestId('poll-details')).not.toBeInTheDocument()
    })
  })

  it('shows mint button if whitelisted (and not minted)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: { state: 2, creator: '0xOther' }, error: null }) // Ended
    read.isUserWhitelisted.mockResolvedValue({ data: true, error: null })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
      expect(screen.queryByTestId('poll-details')).not.toBeInTheDocument()
    })
  })

  it('calls mintResultNFT when button clicked and shows results', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: { state: 2, creator: mockUserAddress.toLowerCase() }, error: null })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: 'Mint Result NFT' })
    fireEvent.click(button)

    expect(screen.getByText('Minting NFT...')).toBeInTheDocument()
    await waitFor(() => {
      expect(write.mintResultNFT).toHaveBeenCalledWith(mockPollId)
      // Results appear after success
      expect(screen.getByText(/NFT Badge Minted Successfully/)).toBeInTheDocument()
      expect(screen.getByTestId('poll-details')).toBeInTheDocument()
    })
  })

  it('shows results immediately if already minted', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    read.getPollById.mockResolvedValue({ data: { state: 2, creator: mockUserAddress.toLowerCase() }, error: null })
    useUserNFTs.mockReturnValue({ nfts: [{ name: `Poll #${mockPollId} Results` }], isLoading: false, error: null, refetch: mockRefetchNFTs })

    render(<MintNFTPage />)

    await waitFor(() => {
        expect(screen.getByText(/NFT Badge Minted Successfully/)).toBeInTheDocument()
        expect(screen.getByTestId('poll-details')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Mint Result NFT' })).not.toBeInTheDocument()
    })
  })
})
