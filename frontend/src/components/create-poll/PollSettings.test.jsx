import { render, screen, fireEvent } from '@testing-library/react'
import PollSettings from './PollSettings'
import '@testing-library/jest-dom'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

describe('PollSettings', () => {
  const mockSetIsAnonymous = jest.fn()
  const mockSetIsSecret = jest.fn()
  const mockOnOptionsLimitChange = jest.fn()
  const defaultProps = {
    isAnonymous: true,
    setIsAnonymous: mockSetIsAnonymous,
    isSecret: false,
    setIsSecret: mockSetIsSecret,
    onOptionsLimitChange: mockOnOptionsLimitChange,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders anonymity and secrecy toggles', () => {
    render(<PollSettings {...defaultProps} />)
    expect(screen.getByText(/Anonymity/i)).toBeInTheDocument()
    expect(screen.getByText(/Secrecy/i)).toBeInTheDocument()
  })

  it('toggles anonymity on click', () => {
    render(<PollSettings {...defaultProps} />)
    const anonymityLabel = screen.getByText(/Anonymity/i)
    fireEvent.click(anonymityLabel.closest('div'))
    expect(mockSetIsAnonymous).toHaveBeenCalledWith(false)
  })

  it('toggles secrecy on click and calls onOptionsLimitChange when enabling', () => {
    render(<PollSettings {...defaultProps} />)
    const secrecyLabel = screen.getByText(/Secrecy/i)
    fireEvent.click(secrecyLabel.closest('div'))
    expect(mockSetIsSecret).toHaveBeenCalledWith(true)
    expect(mockOnOptionsLimitChange).toHaveBeenCalled()
  })

  it('toggles secrecy on click and does not call onOptionsLimitChange when disabling', () => {
    render(<PollSettings {...defaultProps} isSecret={true} />)
    const secrecyLabel = screen.getByText(/Secrecy/i)
    fireEvent.click(secrecyLabel.closest('div'))
    expect(mockSetIsSecret).toHaveBeenCalledWith(false)
    expect(mockOnOptionsLimitChange).not.toHaveBeenCalled()
  })
})
