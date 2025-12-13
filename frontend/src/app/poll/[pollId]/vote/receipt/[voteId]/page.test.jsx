import { render, screen, fireEvent } from '@testing-library/react'
import VoteReceiptPage from './page'
import { useParams } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()

describe('VoteReceiptPage', () => {
  const mockPollId = '123'
  const mockVoteId = '456'

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId, voteId: mockVoteId })
  })

  it('renders success message', () => {
    render(<VoteReceiptPage />)
    expect(screen.getByText('Vote receipt')).toBeInTheDocument()
    expect(screen.getByText('Your vote has been successfully submitted.')).toBeInTheDocument()
  })

  it('handles download button click', () => {
    render(<VoteReceiptPage />)
    
    const downloadBtn = screen.getByText('Download receipt (.txt)')
    
    // Mock anchor click
    const link = { click: jest.fn() }
    jest.spyOn(document, 'createElement').mockImplementation(() => link)
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => {})

    fireEvent.click(downloadBtn)

    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(link.download).toBe(`zkvote-receipt-poll-${mockPollId}-vote-${mockVoteId}.txt`)
    expect(link.click).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalled()
  })
})
