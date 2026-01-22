import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationInstructions from './RegistrationInstructions'

describe('RegistrationInstructions', () => {
  const defaultProps = {
    onRegister: jest.fn(),
    isLoading: false,
    isRegistering: false,
  }

  it('renders instructions list', () => {
    render(<RegistrationInstructions {...defaultProps} />)
    expect(screen.getByText('How it works:')).toBeInTheDocument()
    expect(screen.getByText(/We will ask you to sign a message/)).toBeInTheDocument()
  })

  it('renders register button with correct initial text', () => {
    render(<RegistrationInstructions {...defaultProps} />)
    expect(screen.getByText('Create Identity & Register')).toBeInTheDocument()
  })

  it('calls onRegister when button is clicked', () => {
    render(<RegistrationInstructions {...defaultProps} />)
    fireEvent.click(screen.getByText('Create Identity & Register'))
    expect(defaultProps.onRegister).toHaveBeenCalled()
  })

  it('shows generating text and disables button when loading', () => {
    render(<RegistrationInstructions {...defaultProps} isLoading={true} />)
    const button = screen.getByText('Generating Identity...')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('shows registering text and disables button when registering on chain', () => {
    render(<RegistrationInstructions {...defaultProps} isRegistering={true} />)
    const button = screen.getByText('Registering on Chain...')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })
})
