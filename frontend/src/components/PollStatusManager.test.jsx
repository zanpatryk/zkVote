import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PollStatusManager from './PollStatusManager'
import { startPoll, endPoll } from '@/lib/blockchain/engine/write'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/write', () => ({
  startPoll: jest.fn(),
  endPoll: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

describe('PollStatusManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.confirm
    window.confirm = jest.fn(() => true)
  })

  it('renders start button for Created state (0)', () => {
    render(<PollStatusManager pollId="123" status={0} />)
    expect(screen.getByText('Current Status')).toBeInTheDocument()
    expect(screen.getByText('CREATED')).toBeInTheDocument()
    expect(screen.getByText('Start Poll')).toBeInTheDocument()
    expect(screen.queryByText('End Poll')).not.toBeInTheDocument()
  })

  it('renders end button for Active state (1)', () => {
    render(<PollStatusManager pollId="123" status={1} />)
    expect(screen.getByText('Current Status')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('End Poll')).toBeInTheDocument()
    expect(screen.queryByText('Start Poll')).not.toBeInTheDocument()
  })

  it('renders ended state for Ended state (2)', () => {
    render(<PollStatusManager pollId="123" status={2} />)
    expect(screen.getByText('Poll Status: ENDED')).toBeInTheDocument()
    expect(screen.getByText(/This poll has ended/)).toBeInTheDocument()
    expect(screen.queryByText('Start Poll')).not.toBeInTheDocument()
    expect(screen.queryByText('End Poll')).not.toBeInTheDocument()
  })

  it('starts poll when start button clicked', async () => {
    render(<PollStatusManager pollId="123" status={0} />)
    fireEvent.click(screen.getByText('Start Poll'))
    
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(startPoll).toHaveBeenCalledWith('123')
    })
  })

  it('ends poll when end button clicked', async () => {
    render(<PollStatusManager pollId="123" status={1} />)
    fireEvent.click(screen.getByText('End Poll'))
    
    expect(window.confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(endPoll).toHaveBeenCalledWith('123')
    })
  })

  it('does not act if confirm is cancelled', async () => {
    window.confirm.mockReturnValue(false)
    render(<PollStatusManager pollId="123" status={0} />)
    fireEvent.click(screen.getByText('Start Poll'))
    
    expect(startPoll).not.toHaveBeenCalled()
  })
})
