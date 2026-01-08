import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ManagePoll from './page'
import { useParams, useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

// Mock PollDetails component
jest.mock('@/components/PollDetails', () => {
  return function MockPollDetails({ pollId }) {
    return <div data-testid="poll-details">PollDetails Component: {pollId}</div>
  }
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
}))

describe('ManagePoll Page', () => {
  const mockPush = jest.fn()
  const mockPollId = '123'

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ push: mockPush })
    useParams.mockReturnValue({ pollId: mockPollId })
  })

  it('renders page title', () => {
    render(<ManagePoll />)
    expect(screen.getByText('Poll Details')).toBeInTheDocument()
  })

  it('renders Go Back button', () => {
    render(<ManagePoll />)
    expect(screen.getByText('← Go Back')).toBeInTheDocument()
  })

  it('navigates back to poll list when Go Back is clicked', () => {
    render(<ManagePoll />)
    fireEvent.click(screen.getByText('← Go Back'))
    expect(mockPush).toHaveBeenCalledWith('/poll')
  })

  it('renders PollDetails component with correct pollId', () => {
    render(<ManagePoll />)
    const pollDetails = screen.getByTestId('poll-details')
    expect(pollDetails).toBeInTheDocument()
    expect(pollDetails).toHaveTextContent(`PollDetails Component: ${mockPollId}`)
  })
})
