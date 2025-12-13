import { render, screen, waitFor } from '@testing-library/react'
import PollDetails from './PollDetails'
import * as read from '@/lib/blockchain/engine/read'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
}))

describe('PollDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    read.getPollById.mockReturnValue(new Promise(() => {})) // Never resolves
    render(<PollDetails pollId="123" />)
    expect(screen.getByText('Loading poll data...')).toBeInTheDocument()
  })

  it('renders error state when poll data fails to load', async () => {
    read.getPollById.mockRejectedValue(new Error('Failed to fetch'))
    render(<PollDetails pollId="123" />)

    await waitFor(() => {
      expect(screen.getByText('Poll data could not be loaded.')).toBeInTheDocument()
    })
  })

  it('renders poll data correctly', async () => {
    const mockPoll = {
      title: 'Test Poll',
      description: 'Test Description',
      options: ['Option A', 'Option B']
    }
    read.getPollById.mockResolvedValue(mockPoll)

    render(<PollDetails pollId="123" />)

    await waitFor(() => {
      expect(screen.getByText('Test Poll')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Option A')).toBeInTheDocument()
      expect(screen.getByText('Option B')).toBeInTheDocument()
    })
  })

  it('handles missing poll data gracefully', async () => {
    read.getPollById.mockResolvedValue(null)
    render(<PollDetails pollId="123" />)

    await waitFor(() => {
       expect(screen.getByText('Poll data could not be loaded.')).toBeInTheDocument()
    })
  })
})
