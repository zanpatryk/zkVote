import { render, screen } from '@testing-library/react'
import VerifyPage from './page'
import VoteChecker from '@/components/VoteChecker'

// Mock VoteChecker since we only want to test if it's rendered
jest.mock('@/components/VoteChecker', () => {
  return function MockVoteChecker() {
    return <div data-testid="vote-checker">Mock Vote Checker</div>
  }
})

describe('VerifyPage', () => {
  it('renders the verify page structure', () => {
    render(<VerifyPage />)
    
    expect(screen.getByText('Verify Your Vote')).toBeInTheDocument()
    expect(screen.getByText(/Upload your vote receipt/i)).toBeInTheDocument()
    expect(screen.getByTestId('vote-checker')).toBeInTheDocument()
  })
})
