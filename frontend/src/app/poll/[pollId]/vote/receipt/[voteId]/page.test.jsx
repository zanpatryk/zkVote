import { render, screen, fireEvent } from '@testing-library/react'
import VoteReceiptPage from './page'
import { useParams, useSearchParams } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
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
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('@/components/ReceiptCard', () => () => <div data-testid="receipt-card">ReceiptCard Mock</div>)

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

describe('VoteReceiptPage', () => {
  const mockPollId = '123'
  const mockVoteId = '456'

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId, voteId: mockVoteId })
    useSearchParams.mockReturnValue({ get: jest.fn().mockReturnValue('0x123abc') })
    const { useAccount } = require('wagmi')
    useAccount.mockReturnValue({ address: '0xAddress' })
  })

  it('renders success message', () => {
    render(<VoteReceiptPage />)
    expect(screen.getByText('Vote Submitted')).toBeInTheDocument()
    expect(screen.getByText('Your vote has been successfully cast. Here is your receipt.')).toBeInTheDocument()
  })

  it('handles download button click', () => {
    render(<VoteReceiptPage />)
    
    const downloadBtn = screen.getByText('Download Receipt (.txt)')
    
    // Mock anchor click
    const link = document.createElement('a')
    const clickSpy = jest.spyOn(link, 'click').mockImplementation(() => {})
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(link)
    const appendSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
    const removeSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((el) => el)

    fireEvent.click(downloadBtn)

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(link.download).toBe(`zkvote-receipt-poll-${mockPollId}-vote-${mockVoteId}.txt`)
    expect(clickSpy).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('handles save to wallet button click', () => {
    const { toast } = require('react-hot-toast')
    render(<VoteReceiptPage />)
    
    const saveBtn = screen.getByText('Save to Wallet (Browser)')
    
    // Mock localStorage
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
    
    fireEvent.click(saveBtn)

    expect(setItemSpy).toHaveBeenCalledWith(
      `zk-receipt-0xaddress-${mockPollId}`,
      expect.stringContaining(`"pollId":"${mockPollId}"`)
    )
    expect(toast.success).toHaveBeenCalledWith('Receipt saved to your wallet storage!')
  })
})
