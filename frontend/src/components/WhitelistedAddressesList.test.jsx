
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WhitelistedAddressesList from './WhitelistedAddressesList'
import { useBlockNumber, useReadContract, useWatchContractEvent } from 'wagmi'
import { getWhitelistedAddresses } from '@/lib/blockchain/engine/read'

// Mock wagmi
jest.mock('wagmi', () => ({
  useBlockNumber: jest.fn(),
  useReadContract: jest.fn(),
  useWatchContractEvent: jest.fn()
}))

// Mock read engine
jest.mock('@/lib/blockchain/engine/read', () => ({
  getWhitelistedAddresses: jest.fn()
}))

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

describe('WhitelistedAddressesList', () => {
  const mockPollId = '1'
  const mockCurrentBlock = 10000n

  beforeEach(() => {
    jest.clearAllMocks()
    useBlockNumber.mockReturnValue({ data: mockCurrentBlock })
    useReadContract.mockReturnValue({ data: '0xModuleAddress' })
    useWatchContractEvent.mockImplementation(() => {})
  })

  it('renders correctly and fetches initial addresses', async () => {
    const mockAddresses = ['0x123', '0x456']
    getWhitelistedAddresses.mockResolvedValue(mockAddresses)

    render(<WhitelistedAddressesList pollId={mockPollId} />)

    // Check header
    expect(screen.getByText('Whitelisted Addresses')).toBeInTheDocument()
    
    // Initial fetch should be called with correct range
    // Start block = 10000 - 5000 = 5000
    await waitFor(() => {
        expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 5000n, 10000n)
    })

    // Check addresses are displayed
    await waitFor(() => {
        expect(screen.getByText('0x123')).toBeInTheDocument()
        expect(screen.getByText('0x456')).toBeInTheDocument()
    })
    
    // Check count badge
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays empty state when no addresses found', async () => {
    getWhitelistedAddresses.mockResolvedValue([])

    render(<WhitelistedAddressesList pollId={mockPollId} />)

    await waitFor(() => {
        expect(screen.getByText('No addresses whitelisted yet in the scanned range.')).toBeInTheDocument()
    })
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('loads more history when button is clicked', async () => {
    getWhitelistedAddresses.mockResolvedValueOnce(['0x123']) // First batch
    getWhitelistedAddresses.mockResolvedValueOnce(['0x789']) // Second batch

    render(<WhitelistedAddressesList pollId={mockPollId} />)

    // Wait for first batch
    await waitFor(() => {
        expect(screen.getByText('0x123')).toBeInTheDocument()
    })

    const loadMoreButton = screen.getByText('Load More History')
    expect(loadMoreButton).toBeInTheDocument()
    
    // Current scan buffer is at 5000. Next click should load 0 to 5000 (roughly or exactly depending on boundary logic)
    // Actually the logic is: endBlock = lastInternalBlock - 1
    // lastInternalBlock was 5000
    // new EndBlock = 4999
    // new StartBlock = 4999 - 5000 = -1 -> clamped to 0
    
    fireEvent.click(loadMoreButton)
    
    await waitFor(() => {
       // Check second call arguments. 
       // Start: 0n, End: 4999n
       expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 0n, 4999n)
    })

    await waitFor(() => {
        expect(screen.getByText('0x789')).toBeInTheDocument()
    })
    
    // Should contain both
    expect(screen.getByText('0x123')).toBeInTheDocument()
    expect(screen.getByText('0x789')).toBeInTheDocument()
  })

  it('disables load more button when genesis is reached', async () => {
     // Start at block 3000 to force genesis hit on first load
     useBlockNumber.mockReturnValue({ data: 3000n })
     getWhitelistedAddresses.mockResolvedValue(['0x123'])

     render(<WhitelistedAddressesList pollId={mockPollId} />)

     await waitFor(() => {
         expect(getWhitelistedAddresses).toHaveBeenCalledWith(mockPollId, 0n, 3000n)
     })

     // Since startBlock was 0, it should assume end of history
     await waitFor(() => {
        expect(screen.queryByText('Load More History')).not.toBeInTheDocument()
     })
  })
})
