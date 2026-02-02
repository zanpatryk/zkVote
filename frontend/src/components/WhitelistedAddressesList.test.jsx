import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import WhitelistedAddressesList from './WhitelistedAddressesList'
import { useWhitelistedAddresses } from '@/hooks/useWhitelistedAddresses'

// Mock the hook
jest.mock('@/hooks/useWhitelistedAddresses', () => ({
  useWhitelistedAddresses: jest.fn(),
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('WhitelistedAddressesList', () => {
  const mockPollId = '1'
  const mockLoadMore = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useWhitelistedAddresses.mockReturnValue({
      addresses: new Set(['0x123', '0x456']),
      loading: false,
      hasMore: true,
      loadMore: mockLoadMore,
      lastScannedBlock: 10000n,
    })
  })

  it('renders correctly and displays addresses', () => {
    render(<WhitelistedAddressesList pollId={mockPollId} />)

    // Check header
    expect(screen.getByText('Whitelisted Addresses')).toBeInTheDocument()
    
    // Check count badge
    expect(screen.getByText('2')).toBeInTheDocument()

    // Check addresses are displayed
    expect(screen.getByText('0x123')).toBeInTheDocument()
    expect(screen.getByText('0x456')).toBeInTheDocument()
    
    // Check footer info
    expect(screen.getByText('Scanned until block: 10000')).toBeInTheDocument()
  })

  it('displays empty state when no addresses found', () => {
    useWhitelistedAddresses.mockReturnValue({
      addresses: new Set(),
      loading: false,
      hasMore: true,
      loadMore: mockLoadMore,
      lastScannedBlock: 10000n,
    })

    render(<WhitelistedAddressesList pollId={mockPollId} />)

    expect(screen.getByText('No addresses whitelisted yet in the scanned range.')).toBeInTheDocument()
  })

  it('calls loadMore when button is clicked', () => {
    render(<WhitelistedAddressesList pollId={mockPollId} />)

    const button = screen.getByText('Load More History')
    fireEvent.click(button)

    expect(mockLoadMore).toHaveBeenCalled()
  })

  it('hides load more button when hasMore is false', () => {
    useWhitelistedAddresses.mockReturnValue({
      addresses: new Set(['0x123']),
      loading: false,
      hasMore: false,
      loadMore: mockLoadMore,
      lastScannedBlock: 0n,
    })

    render(<WhitelistedAddressesList pollId={mockPollId} />)

    expect(screen.queryByText('Load More History')).not.toBeInTheDocument()
  })
  
  it('shows loading state on button', () => {
    useWhitelistedAddresses.mockReturnValue({
        addresses: new Set(['0x123']),
        loading: true,
        hasMore: true,
        loadMore: mockLoadMore,
        lastScannedBlock: 10000n,
    })

    render(<WhitelistedAddressesList pollId={mockPollId} />)
    
    expect(screen.getByText('Scanning...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
