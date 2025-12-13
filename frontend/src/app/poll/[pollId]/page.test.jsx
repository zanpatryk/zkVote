import { render, screen, waitFor } from '@testing-library/react'
import ManagePoll from './page'
import { getPollById } from '@/lib/blockchain/engine/read'
import { useParams } from 'next/navigation'

// Mock dependencies
jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}))

describe('ManagePoll Page', () => {
  const mockPollId = '123'
  const mockPollData = {
    title: 'Test Poll',
    description: 'This is a test poll description',
    options: ['Option 1', 'Option 2', 'Option 3'],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId })
  })

  it('renders loading state initially', () => {
    // Return a promise that never resolves to simulate loading
    getPollById.mockReturnValue(new Promise(() => {}))
    
    render(<ManagePoll />)
    
    expect(screen.getByText('Loading poll data...')).toBeInTheDocument()
  })

  it('renders poll details when data is loaded', async () => {
    getPollById.mockResolvedValue(mockPollData)
    
    render(<ManagePoll />)
    
    await waitFor(() => {
      expect(screen.getByText(mockPollData.title)).toBeInTheDocument()
    })
    
    expect(screen.getByText(mockPollData.description)).toBeInTheDocument()
    expect(screen.getByText('Options')).toBeInTheDocument()
    mockPollData.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument()
    })
  })

  it('renders error message when poll data fails to load or is null', async () => {
    getPollById.mockResolvedValue(null)
    
    render(<ManagePoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Poll data could not be loaded.')).toBeInTheDocument()
    })
  })

  it('renders error message when getPollById throws', async () => {
    getPollById.mockRejectedValue(new Error('Fetch error'))
    
    render(<ManagePoll />)
    
    await waitFor(() => {
      expect(screen.getByText('Poll data could not be loaded.')).toBeInTheDocument()
    })
  })

  it('does not render description if missing', async () => {
    const pollWithoutDescription = { ...mockPollData, description: '' }
    getPollById.mockResolvedValue(pollWithoutDescription)
    
    render(<ManagePoll />)
    
    await waitFor(() => {
      expect(screen.getByText(pollWithoutDescription.title)).toBeInTheDocument()
    })
    
    expect(screen.queryByText('This is a test poll description')).not.toBeInTheDocument()
  })
})
