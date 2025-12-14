import { render, screen, fireEvent } from '@testing-library/react'
import VoteBallot from './VoteBallot'
import '@testing-library/jest-dom'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    label: ({ children, ...props }) => <label {...props}>{children}</label>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('VoteBallot Component', () => {
  const mockPoll = {
    title: 'Test Poll',
    description: 'Test Description',
    options: ['Option A', 'Option B'],
    state: 1, // Active
  }
  const mockSubmit = jest.fn()
  const mockSetSelectedIndex = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockSubmit.mockImplementation((e) => e.preventDefault())
  })

  it('renders ballot with active poll details', () => {
    render(
      <VoteBallot 
        poll={mockPoll}
        pollId="123"
        alreadyVoted={false}
        submitting={false}
        onSubmit={mockSubmit}
        selectedIndex={null}
        setSelectedIndex={mockSetSelectedIndex}
      />
    )

    expect(screen.getByText('Test Poll')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Poll ID #123')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
    expect(screen.getByText('Cast Vote')).toBeInTheDocument()
  })

  it('handles option selection', () => {
    render(
      <VoteBallot 
        poll={mockPoll}
        pollId="123"
        alreadyVoted={false}
        submitting={false}
        onSubmit={mockSubmit}
        selectedIndex={null}
        setSelectedIndex={mockSetSelectedIndex}
      />
    )

    const optionA = screen.getByText('Option A')
    fireEvent.click(optionA)

    // The click handler is on the input or label which triggers setSelectedIndex(0)
    // The implementation puts the onClick on the radio input's onChange
    const radioInputs = screen.getAllByRole('radio')
    fireEvent.click(radioInputs[0])
    
    expect(mockSetSelectedIndex).toHaveBeenCalledWith(0)
  })

  it('handles submission', () => {
    render(
      <VoteBallot 
        poll={mockPoll}
        pollId="123"
        alreadyVoted={false}
        submitting={false}
        onSubmit={mockSubmit}
        selectedIndex={0} // Option selected
        setSelectedIndex={mockSetSelectedIndex}
      />
    )

    const submitBtn = screen.getByText('Cast Vote')
    fireEvent.click(submitBtn)

    expect(mockSubmit).toHaveBeenCalled()
  })

  it('disables button when submitting', () => {
    render(
      <VoteBallot 
        poll={mockPoll}
        pollId="123"
        alreadyVoted={false}
        submitting={true}
        onSubmit={mockSubmit}
        selectedIndex={0}
        setSelectedIndex={mockSetSelectedIndex}
      />
    )

    const submitBtn = screen.getByText('Authenticating...')
    expect(submitBtn).toBeDisabled()
  })

  it('renders "Voting Closed" state', () => {
    const closedPoll = { ...mockPoll, state: 2 } // Ended
    render(
      <VoteBallot 
        poll={closedPoll}
        pollId="123"
        alreadyVoted={false}
        submitting={false}
        onSubmit={mockSubmit}
        selectedIndex={null}
        setSelectedIndex={mockSetSelectedIndex}
      />
    )

    expect(screen.getByText('Voting Closed')).toBeInTheDocument()
    expect(screen.getByText('This poll has ended.')).toBeInTheDocument()
    expect(screen.queryByText('Cast Vote')).not.toBeInTheDocument()
  })

  it('renders "Vote Cast" state when already voted', () => {
    render(
      <VoteBallot 
        poll={mockPoll}
        pollId="123"
        alreadyVoted={true}
        voteTxHash="0xabc"
        submitting={false}
        onSubmit={mockSubmit}
        selectedIndex={null}
        setSelectedIndex={mockSetSelectedIndex}
      />
    )

    expect(screen.getByText('Vote Cast')).toBeInTheDocument()
    expect(screen.getByText('You have already voted.')).toBeInTheDocument()
    expect(screen.getByText('View Receipt')).toBeInTheDocument()
    expect(screen.queryByText('Cast Vote')).not.toBeInTheDocument()
  })

  it('renders null if poll is missing', () => {
    const { container } = render(<VoteBallot poll={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
