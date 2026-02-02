import { render, screen, fireEvent } from '@testing-library/react'
import VoterCapacity from './VoterCapacity'
import '@testing-library/jest-dom'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

describe('VoterCapacity', () => {
  const mockSetDepth = jest.fn()
  const defaultProps = {
    depth: 20,
    setDepth: mockSetDepth,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders depth slider and capacity', () => {
    render(<VoterCapacity {...defaultProps} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(screen.getByText('Max Participants')).toBeInTheDocument()
    // Since numbers are split into spans, we check if the container has the text
    const container = screen.getByText('Max Participants').parentElement
    expect(container).toHaveTextContent('1,048,576')
  })

  it('calls setDepth on slider change', () => {
    render(<VoterCapacity {...defaultProps} />)
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '25' } })
    expect(mockSetDepth).toHaveBeenCalledWith(25)
  })

  it('increments depth on plus button click', () => {
    render(<VoterCapacity {...defaultProps} />)
    const plusBtn = screen.getByText('+')
    fireEvent.click(plusBtn)
    expect(mockSetDepth).toHaveBeenCalled()
    const updater = mockSetDepth.mock.calls[0][0]
    expect(updater(20)).toBe(21)
  })

  it('decrements depth on minus button click', () => {
    render(<VoterCapacity {...defaultProps} />)
    const minusBtn = screen.getByText('-')
    fireEvent.click(minusBtn)
    expect(mockSetDepth).toHaveBeenCalled()
    const updater = mockSetDepth.mock.calls[0][0]
    expect(updater(20)).toBe(19)
  })

  it('respects limits in updater functions', () => {
    render(<VoterCapacity {...defaultProps} />)
    
    const plusBtn = screen.getByText('+')
    fireEvent.click(plusBtn)
    const plusUpdater = mockSetDepth.mock.calls[0][0]
    expect(plusUpdater(32)).toBe(32)

    const minusBtn = screen.getByText('-')
    fireEvent.click(minusBtn)
    const minusUpdater = mockSetDepth.mock.calls[1][0]
    expect(minusUpdater(16)).toBe(16)
  })
})
