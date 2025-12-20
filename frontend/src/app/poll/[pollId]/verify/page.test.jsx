import { render, screen, fireEvent } from '@testing-library/react'
import PollVerifyPage from './page'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { getPollById } from '@/lib/blockchain/engine/read'
import { toast } from 'react-hot-toast'
import React, { use } from 'react'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
  },
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
}))

jest.mock('@/components/VoteChecker', () => () => <div data-testid="vote-checker">VoteChecker Mock</div>)

// Mock React.use
jest.mock('react', () => {
  const original = jest.requireActual('react')
  return {
    ...original,
    use: jest.fn(p => {
      if (p && typeof p.then === 'function') {
        // This is a simplified mock for use(promise)
        // In a real test environment we might need a more complex setup
        // but since we control the promise in the test, we'll try to keep it synchronous if possible
        let value;
        p.then(v => { value = v });
        return value || { pollId: '123' }; // Fallback for immediate sync access or just mock it to return the resolved value
      }
      return p
    }),
  }
})

describe('PollVerifyPage', () => {
  const mockPollId = '123'
  const mockAddress = '0xWallet'
  const mockRouter = { push: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue(mockRouter)
    useAccount.mockReturnValue({ address: mockAddress })
    getPollById.mockResolvedValue({ id: mockPollId, title: 'Sample Poll' })
    localStorage.clear()
  })

  it('renders poll info and VoteChecker', async () => {
    render(<PollVerifyPage params={Promise.resolve({ pollId: mockPollId })} />)
    
    expect(await screen.findByText('Verify Your Vote')).toBeInTheDocument()
    expect(screen.getByTestId('vote-checker')).toBeInTheDocument()
  })

  it('prompts to connect wallet if not connected', async () => {
    const { useAccount } = require('wagmi')
    useAccount.mockReturnValue({ address: null })

    render(<PollVerifyPage params={Promise.resolve({ pollId: mockPollId })} />)

    expect(await screen.findByText('Check for Saved Receipts')).toBeInTheDocument()
    expect(screen.getByText(/Connect your wallet to see/)).toBeInTheDocument()
  })

  it('shows no receipt found message if connected but no receipt', async () => {
    const { useAccount } = require('wagmi')
    useAccount.mockReturnValue({ address: mockAddress })
    // Ensure no receipt in storage
    localStorage.removeItem(`zk-receipt-${mockAddress.toLowerCase()}-${mockPollId}`)

    render(<PollVerifyPage params={Promise.resolve({ pollId: mockPollId })} />)

    expect(await screen.findByText('No Saved Receipt Found')).toBeInTheDocument()
    expect(screen.getByText(/couldn't find a receipt/)).toBeInTheDocument()
  })

  it('detects and shows stored receipt from wallet', async () => {
    const receiptData = {
      pollId: mockPollId,
      voteId: '456',
      txHash: '0xTx',
      nullifier: '0xNull',
      proof: '0xProof'
    }
    localStorage.setItem(`zk-receipt-${mockAddress.toLowerCase()}-${mockPollId}`, JSON.stringify(receiptData))

    render(<PollVerifyPage params={Promise.resolve({ pollId: mockPollId })} />)

    expect(await screen.findByText('Saved Receipt Found')).toBeInTheDocument()
    expect(screen.getByText('Verify with Wallet Storage')).toBeInTheDocument()
  })

  it('redirects to check page when clicking Verify with Wallet Storage', async () => {
    const receiptData = {
      pollId: mockPollId,
      voteId: '456',
      txHash: '0xTx',
      nullifier: '0xNull',
      proof: '0xProof'
    }
    localStorage.setItem(`zk-receipt-${mockAddress.toLowerCase()}-${mockPollId}`, JSON.stringify(receiptData))

    render(<PollVerifyPage params={Promise.resolve({ pollId: mockPollId })} />)

    const verifyBtn = await screen.findByText('Verify with Wallet Storage')
    fireEvent.click(verifyBtn)

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining(`/poll/${mockPollId}/vote/check/456`)
    )
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining('nullifier=0xNull')
    )
  })
})
