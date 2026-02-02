import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import TallyManager from './TallyManager'
import '@testing-library/jest-dom'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { usePublishTally } from '@/hooks/usePublishTally'
import { POLL_STATE } from '@/lib/constants'

// Mock dependencies
jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('@/hooks/usePublishTally', () => ({
  usePublishTally: jest.fn(),
}))

describe('TallyManager', () => {
  const mockPollId = '1'
  const mockPublishTally = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    usePollRegistry.mockReturnValue({
      resultsPublished: false,
    })
    
    usePublishTally.mockReturnValue({
      publishTally: mockPublishTally,
      isProcessing: false,
      decryptedTally: null,
      ciphertexts: [Array(16).fill(['0', '0']), Array(16).fill(['0', '0'])], // Default loaded
      refetchCiphertexts: jest.fn(),
    })
  })
  
  afterEach(() => {
    cleanup()
  })

  it('renders locked state when pollState is not ENDED', () => {
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ACTIVE} isSecret={true} />)
    expect(screen.getByText('Tally Locked')).toBeInTheDocument()
    expect(screen.getByText(/You must END the poll before decrypting results/)).toBeInTheDocument()
  })

  it('renders public message when poll is not secret', () => {
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={false} />)
    expect(screen.getByText('Public Poll')).toBeInTheDocument()
    expect(screen.getByText(/Results are available publicly without decryption/)).toBeInTheDocument()
  })

  it('renders published state when resultsPublished is true', () => {
    usePollRegistry.mockReturnValue({
      resultsPublished: true,
    })
    
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    expect(screen.getByText('Results Published')).toBeInTheDocument()
    expect(screen.getByText(/The tally has been decrypted and published to the blockchain/)).toBeInTheDocument()
  })

  it('renders decryption form when poll is ended and results not published', () => {
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    expect(screen.getByText('Decrypt Tally')).toBeInTheDocument()
    expect(screen.getByLabelText('Poll Secret Key (SK)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Decrypt & Publish Results/i })).toBeInTheDocument()
  })

  it('updates secret key input', () => {
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    const input = screen.getByLabelText('Poll Secret Key (SK)')
    fireEvent.change(input, { target: { value: '123456' } })
    expect(input.value).toBe('123456')
  })

  it('calls publishTally when button is clicked', async () => {
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    
    const input = screen.getByLabelText('Poll Secret Key (SK)')
    fireEvent.change(input, { target: { value: '123' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Decrypt & Publish Results/i }))

    await waitFor(() => {
      expect(mockPublishTally).toHaveBeenCalledWith('123')
    })
  })

  it('shows loading message when ciphertexts are not available', () => {
    usePublishTally.mockReturnValue({
      publishTally: mockPublishTally,
      isProcessing: false,
      decryptedTally: null,
      ciphertexts: null, // Not loaded
    })
    
    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    expect(screen.getByText('Loading encrypted data...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Decrypt & Publish Results/i })).toBeDisabled()
  })

  it('shows processing state when isProcessing is true', () => {
    usePublishTally.mockReturnValue({
      publishTally: mockPublishTally,
      isProcessing: true,
      decryptedTally: null,
      ciphertexts: [], 
    })

    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled()
  })

  it('displays decrypted tally preview when available', () => {
    usePublishTally.mockReturnValue({
      publishTally: mockPublishTally,
      isProcessing: false,
      decryptedTally: [10n, 5n],
      ciphertexts: [],
    })

    render(<TallyManager pollId={mockPollId} pollState={POLL_STATE.ENDED} isSecret={true} />)
    expect(screen.getByText('Preview Decrypted Results:')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

