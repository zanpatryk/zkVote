import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ManagePoll from './page'
import { useParams, useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock('@/hooks/usePollRegistry', () => ({
  usePollRegistry: jest.fn()
}))

jest.mock('@/hooks/useZKVote', () => ({
  useZKVote: jest.fn()
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

// Mock BackButton
jest.mock('@/components/BackButton', () => {
  return function MockBackButton({ href, label }) {
    return <a href={href}>← {label || 'Go Back'}</a>
  }
})

describe('ManagePoll Page', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }
  const mockPollId = '123'

  const { usePollRegistry } = require('@/hooks/usePollRegistry')
  const { useZKVote } = require('@/hooks/useZKVote')

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ pollId: mockPollId })
    useRouter.mockReturnValue(mockRouter)
    
    usePollRegistry.mockReturnValue({
        isLoading: false,
        isRegistered: false,
    })
    
    useZKVote.mockReturnValue({})
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
    const link = screen.getByText('← Go Back').closest('a')
    expect(link).toHaveAttribute('href', '/poll')
  })

  it('renders PollDetails component with correct pollId', () => {
    render(<ManagePoll />)
    const pollDetails = screen.getByTestId('poll-details')
    expect(pollDetails).toBeInTheDocument()
    expect(pollDetails).toHaveTextContent(`PollDetails Component: ${mockPollId}`)
  })
})
