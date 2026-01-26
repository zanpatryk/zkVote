import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MintNFTPage from '../src/app/poll/[pollId]/nft/page'
import '@testing-library/jest-dom'
import { useMintEligibility } from '../src/hooks/useMintEligibility'
import * as write from '../src/lib/blockchain/engine/write'
import * as wagmi from 'wagmi'
import { useRouter, useParams } from 'next/navigation'
import React from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('../src/hooks/useMintEligibility', () => ({
  useMintEligibility: jest.fn(),
}))

jest.mock('../src/lib/blockchain/engine/write', () => ({
  mintResultNFT: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: { 
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  },
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
    button: ({ children, onClick, disabled, className }) => (
      <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
    )
  },
}))

jest.mock('../src/components/PollDetails', () => () => <div data-testid="poll-details">Poll Details Rendered</div>)
jest.mock('../src/components/BackButton', () => () => <button>Back</button>)

describe('Integration Test: NFT Claim Page', () => {
  const mockPush = jest.fn()
  const mockReplace = jest.fn()
  const mockPollId = '100'
  const mockRefetchNFTs = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush, replace: mockReplace })
    useParams.mockReturnValue({ pollId: mockPollId })
    wagmi.useAccount.mockReturnValue({ isConnected: true, address: '0xUser' })
    
    // Default: eligible, not minted
    useMintEligibility.mockReturnValue({
      poll: { creator: '0xCreator', state: 2 },
      canMint: true,
      hasMinted: false,
      isWrongState: false,
      isResultsPending: false,
      isLoading: false,
      error: null,
      refetchNFTs: mockRefetchNFTs
    })
  })

  it('renders access denied if disconnected', async () => {
    wagmi.useAccount.mockReturnValue({ isConnected: false })
    render(<MintNFTPage />)
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })

  it('redirects if poll is not ended', async () => {
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

  it('redirects if ZK poll results not published', async () => {
    useMintEligibility.mockReturnValue({
      isLoading: false,
      isResultsPending: true,
      error: null,
    })

    render(<MintNFTPage />)
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(`/poll/${mockPollId}`)
    })
  })

  it('renders unauthorized if user is not eligible', async () => {
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

  it('renders mint button if user is eligible', async () => {
    render(<MintNFTPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mint Result NFT' })).toBeInTheDocument()
    })
  })

  it('calls mint function on click', async () => {
    write.mintResultNFT.mockResolvedValue({ hash: '0x123' })
    
    render(<MintNFTPage />)

    const button = screen.getByRole('button', { name: 'Mint Result NFT' })
    fireEvent.click(button)
    
    expect(write.mintResultNFT).toHaveBeenCalledWith(mockPollId)
  })

  it('shows already minted state if user owns the NFT', async () => {
    useMintEligibility.mockReturnValue({
      hasMinted: true,
      isLoading: false,
    })

    render(<MintNFTPage />)

    await waitFor(() => {
      expect(screen.getByText('NFT Badge Minted Successfully')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Mint Result NFT' })).not.toBeInTheDocument()
    })
  })
})
