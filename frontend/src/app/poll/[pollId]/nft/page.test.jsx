import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import MintNFTPage from './page'
import * as write from '@/lib/blockchain/engine/write'
import * as wagmi from 'wagmi'
import { toast } from 'react-hot-toast'
import { useRouter, useParams } from 'next/navigation'
import { useMintEligibility } from '@/hooks/useMintEligibility'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  // Empty mock for the library if it is not used directly
}))

jest.mock('@/hooks/useMintEligibility', () => ({
  useMintEligibility: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/write', () => ({
  mintResultNFT: jest.fn(),
}))

// Mock the useUserNFTs hook
const mockRefetchNFTs = jest.fn()
jest.mock('@/hooks/useUserNFTs', () => ({
  useUserNFTs: jest.fn(),
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
  toast: { 
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  },
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
    // Default: eligible, results published, not minted
    useMintEligibility.mockReturnValue({
      poll: { state: 2, creator: '0xOther' },
      canMint: true,
      hasMinted: false,
      isWrongState: false,
      isResultsPending: false,
      isLoading: false,
      error: null,
      refetchNFTs: mockRefetchNFTs
    })
  })

  it('renders connection error state', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    useMintEligibility.mockReturnValue({
      isLoading: false,
      error: 'Network Error',
    })

    render(<MintNFTPage />)

    await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
    })
  })

  it('shows access denied if wallet not connected', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    useMintEligibility.mockReturnValue({
      isLoading: false,
      error: null,
    })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
    })
  })

  it('redirects if poll is not ended', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    useMintEligibility.mockReturnValue({
      isLoading: false,
      isWrongState: true,
      error: null,
    })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/poll/${mockPollId}`)
    })
  })

  it('shows not authorized if canMint is false and state is correct', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    useMintEligibility.mockReturnValue({
      poll: { state: 2 },
      canMint: false,
      isWrongState: false,
      isResultsPending: false,
      isLoading: false,
      error: null,
    })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Not Authorized')).toBeInTheDocument()
    })
  })

  it('shows mint button if eligible (canMint is true)', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    useMintEligibility.mockReturnValue({
      canMint: true,
      hasMinted: false,
      isLoading: false,
    })
    
    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
    })
  })



  it('calls mintResultNFT and shows success state', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    useMintEligibility.mockReturnValue({
      canMint: true,
      hasMinted: false,
      isLoading: false,
      refetchNFTs: mockRefetchNFTs
    })
    
    render(<MintNFTPage />)
    
    const button = screen.getByRole('button', { name: 'Mint Result NFT' })
    fireEvent.click(button)

    expect(screen.getByText('Minting NFT...')).toBeInTheDocument()
    expect(toast.loading).toHaveBeenCalledWith('Minting Result NFT...', expect.any(Object))

    await waitFor(() => {
      expect(write.mintResultNFT).toHaveBeenCalledWith(mockPollId)
    })
    
    expect(toast.success).toHaveBeenCalledWith('NFT minted successfully!', expect.any(Object))
  })

  it('shows already minted state', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: mockUserAddress })
    useMintEligibility.mockReturnValue({
      hasMinted: true,
      isLoading: false,
    })

    render(<MintNFTPage />)

    await waitFor(() => {
        expect(screen.getByText(/NFT Badge Minted Successfully/)).toBeInTheDocument()
        expect(screen.getByTestId('poll-details')).toBeInTheDocument()
    })
  })
})
