import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationInstructions from './RegistrationInstructions'

describe('RegistrationInstructions', () => {
  const defaultProps = {
    onRegister: jest.fn(),
    isLoading: false,
    isRegistering: false,
  }

  it('renders registration steps', () => {
    render(<RegistrationInstructions {...defaultProps} />)
    expect(screen.getByText('Create ZK Identity')).toBeInTheDocument()
    expect(screen.getByText('Sign Message')).toBeInTheDocument()
    expect(screen.getByText('Generate Proof')).toBeInTheDocument()
    expect(screen.getByText('Register on Chain')).toBeInTheDocument()
  })

  it('renders register button with correct initial text', () => {
    render(<RegistrationInstructions {...defaultProps} />)
    expect(screen.getByText('Register & Create Identity')).toBeInTheDocument()
  })

  it('calls onRegister when button is clicked', () => {
    render(<RegistrationInstructions {...defaultProps} />)
    fireEvent.click(screen.getByText('Register & Create Identity'))
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

  it('renders in demo mode with simplified header', () => {
    render(<RegistrationInstructions {...defaultProps} demo={true} />)
    expect(screen.getByText('Registration')).toBeInTheDocument()
    expect(screen.queryByText('Create ZK Identity')).not.toBeInTheDocument()
  })

  it('does not call onRegister in demo mode', () => {
    const onRegister = jest.fn()
    render(<RegistrationInstructions {...defaultProps} onRegister={onRegister} demo={true} />)
    fireEvent.click(screen.getByText('Register & Create Identity'))
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('button is not disabled in demo mode regardless of loading states', () => {
    render(<RegistrationInstructions {...defaultProps} demo={true} isLoading={true} isRegistering={true} />)
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })
})
