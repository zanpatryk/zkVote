import { render, screen } from '@testing-library/react'
import TabDetails from './TabDetails'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/components/PollDetails', () => {
  return function MockPollDetails({ showResults }) {
    return <div data-testid="poll-details">PollDetails (Results: {showResults ? 'Yes' : 'No'})</div>
  }
})

jest.mock('@/components/PollStatusManager.jsx', () => {
  return function MockPollStatusManager() {
    return <div data-testid="poll-status-manager">PollStatusManager</div>
  }
})

describe('TabDetails', () => {
  const defaultProps = {
    pollId: '123',
    pollState: 1, // Active
    maxParticipants: 100,
    onStatusChange: jest.fn(),
  }

  it('renders poll configuration section', () => {
    render(<TabDetails {...defaultProps} />)
    expect(screen.getByText('Poll Configuration')).toBeInTheDocument()
    expect(screen.getByText('Max Capacity:')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByTestId('poll-details')).toBeInTheDocument()
  })

  it('renders status management section when pollState is present', () => {
    render(<TabDetails {...defaultProps} />)
    expect(screen.getByText('Status Management')).toBeInTheDocument()
    expect(screen.getByTestId('poll-status-manager')).toBeInTheDocument()
  })

  it('passes true to showResults when poll is ended', () => {
    render(<TabDetails {...defaultProps} pollState={2} />)
    expect(screen.getByTestId('poll-details')).toHaveTextContent('Results: Yes')
  })

  it('passes false to showResults when poll is active', () => {
    render(<TabDetails {...defaultProps} pollState={1} />)
    expect(screen.getByTestId('poll-details')).toHaveTextContent('Results: No')
  })
})
