import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PollStatusManager from './PollStatusManager'
import { POLL_STATE } from '@/lib/constants'
import '@testing-library/jest-dom'

// Define mocks outside to keep them stable across renders
const mockStartPoll = jest.fn((id, cb) => { cb?.(); return Promise.resolve() })
const mockEndPoll = jest.fn((id, cb) => { cb?.(); return Promise.resolve() })

// Mock dependencies
jest.mock('@/hooks/usePollManagement', () => ({
  usePollManagement: () => ({
    startPoll: mockStartPoll,
    endPoll: mockEndPoll,
    isStarting: false,
    isEnding: false
  })
}))

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

describe('PollStatusManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders start button for Created state', () => {
    render(<PollStatusManager pollId="123" status={POLL_STATE.CREATED} />)
    expect(screen.getByText('Current Status')).toBeInTheDocument()
    expect(screen.getByText('CREATED')).toBeInTheDocument()
    expect(screen.getByText('Start Poll')).toBeInTheDocument()
    expect(screen.queryByText('End Poll')).not.toBeInTheDocument()
  })

  it('renders end button for Active state', () => {
    render(<PollStatusManager pollId="123" status={POLL_STATE.ACTIVE} />)
    expect(screen.getByText('Current Status')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('End Poll')).toBeInTheDocument()
    expect(screen.queryByText('Start Poll')).not.toBeInTheDocument()
  })

  it('renders ended state for Ended state', () => {
    render(<PollStatusManager pollId="123" status={POLL_STATE.ENDED} />)
    expect(screen.getByText('Poll Status: ENDED')).toBeInTheDocument()
    expect(screen.getByText(/This poll has ended/)).toBeInTheDocument()
    expect(screen.queryByText('Start Poll')).not.toBeInTheDocument()
    expect(screen.queryByText('End Poll')).not.toBeInTheDocument()
  })

  it('shows start confirmation modal and starts poll on confirm', async () => {
    render(<PollStatusManager pollId="123" status={POLL_STATE.CREATED} />)
    fireEvent.click(screen.getByText('Start Poll'))
    
    // Modal should appear
    expect(screen.getByText('Start Voting?')).toBeInTheDocument()
    expect(screen.getByText('Confirm Start')).toBeInTheDocument()
    
    // Click confirm in modal
    fireEvent.click(screen.getByText('Confirm Start'))
    
    await waitFor(() => {
        expect(mockStartPoll).toHaveBeenCalledWith("123", undefined)
    })
  })

  it('shows end confirmation modal and ends poll on confirm', async () => {
    render(<PollStatusManager pollId="123" status={POLL_STATE.ACTIVE} />)
    fireEvent.click(screen.getByText('End Poll'))
    
    // Modal should appear
    expect(screen.getByText('End Voting?')).toBeInTheDocument()
    expect(screen.getByText('End Poll Now')).toBeInTheDocument()

    // Click confirm in modal
    fireEvent.click(screen.getByText('End Poll Now'))
    
    await waitFor(() => {
        expect(mockEndPoll).toHaveBeenCalledWith("123", undefined)
    })
  })

  it('closes modal and does not start/end poll if cancelled', async () => {
    render(<PollStatusManager pollId="123" status={POLL_STATE.CREATED} />)
    fireEvent.click(screen.getByText('Start Poll'))
    
    // Modal should appear
    expect(screen.getByText('Start Voting?')).toBeInTheDocument()

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'))

    // Modal should disappear
    await waitFor(() => {
        expect(screen.queryByText('Start Voting?')).not.toBeInTheDocument()
    })
    
    expect(mockStartPoll).not.toHaveBeenCalled()
  })
})
