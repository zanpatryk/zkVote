import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PollFundingManager from './PollFundingManager'
import { usePollFunding } from '@/hooks/usePollFunding'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/hooks/usePollFunding', () => ({
  usePollFunding: jest.fn(),
}))

jest.mock('viem', () => ({
  formatEther: jest.fn((val) => {
    if (val === 1000000000000000000n) return '1.0'
    if (val === 0n) return '0'
    return '0.1' // fallback
  }),
}))

describe('PollFundingManager', () => {
  const mockPollId = '123'
  const mockFund = jest.fn()
  const mockWithdrawAll = jest.fn()
  
  const defaultHookValues = {
    balance: 0n,
    isLoadingBalance: false,
    isFunding: false,
    isWithdrawing: false,
    fund: mockFund,
    withdrawAll: mockWithdrawAll,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    usePollFunding.mockReturnValue(defaultHookValues)
  })

  it('renders loading state for balance', () => {
    usePollFunding.mockReturnValue({
      ...defaultHookValues,
      isLoadingBalance: true,
    })
    
    render(<PollFundingManager pollId={mockPollId} status={1} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders current budget', () => {
    usePollFunding.mockReturnValue({
      ...defaultHookValues,
      balance: 1000000000000000000n, // 1 ETH
    })
    
    render(<PollFundingManager pollId={mockPollId} status={1} />)
    expect(screen.getByText('1.0 ETH')).toBeInTheDocument()
  })

  it('shows Fund Poll button when status is ACTIVE (1)', () => {
    render(<PollFundingManager pollId={mockPollId} status={1} />)
    expect(screen.getByText('Fund Poll')).toBeInTheDocument()
    expect(screen.queryByText('Withdraw Funds')).not.toBeInTheDocument()
  })

  it('shows Fund Poll button when status is CREATED (0)', () => {
    render(<PollFundingManager pollId={mockPollId} status={0} />)
    expect(screen.getByText('Fund Poll')).toBeInTheDocument()
  })

  it('shows Withdraw Funds button when status is ENDED (2)', () => {
    // Need balance > 0 to enable withdraw button
    usePollFunding.mockReturnValue({
      ...defaultHookValues,
      balance: 1000000000000000000n,
    })
    render(<PollFundingManager pollId={mockPollId} status={2} />)
    expect(screen.getByText('Withdraw Funds')).toBeInTheDocument()
    expect(screen.queryByText('Fund Poll')).not.toBeInTheDocument()
  })

  it('disables Withdraw button if balance is 0', () => {
    usePollFunding.mockReturnValue({
      ...defaultHookValues,
      balance: 0n,
    })
    render(<PollFundingManager pollId={mockPollId} status={2} />)
    const btn = screen.getByText('Withdraw Funds')
    expect(btn).toBeDisabled()
  })

  it('opens fund modal and submits', async () => {
    render(<PollFundingManager pollId={mockPollId} status={1} />)
    
    fireEvent.click(screen.getByText('Fund Poll'))
    
    expect(screen.getByText('Amount (ETH)')).toBeInTheDocument()
    
    const input = screen.getByPlaceholderText('0.1')
    fireEvent.change(input, { target: { value: '0.5' } })
    
    fireEvent.click(screen.getByText('Confirm Funding'))
    
    expect(mockFund).toHaveBeenCalledWith('0.5')
  })

  it('calls withdrawAll when withdraw button is clicked', () => {
    usePollFunding.mockReturnValue({
      ...defaultHookValues,
      balance: 1000000000000000000n,
    })
    render(<PollFundingManager pollId={mockPollId} status={2} />)
    
    fireEvent.click(screen.getByText('Withdraw Funds'))
    expect(mockWithdrawAll).toHaveBeenCalled()
  })
})
