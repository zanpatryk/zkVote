import { render, screen, fireEvent } from '@testing-library/react'
import IdentityAuthenticator from './IdentityAuthenticator'

describe('IdentityAuthenticator', () => {
  const defaultProps = {
    onRegenerateIdentity: jest.fn(),
    onFileUpload: jest.fn(),
    isLoading: false,
    isUploading: false,
  }

  it('renders authentication options', () => {
    render(<IdentityAuthenticator {...defaultProps} />)
    expect(screen.getByText('Authenticate Identity')).toBeInTheDocument()
    expect(screen.getByText('Sign with Wallet')).toBeInTheDocument()
    expect(screen.getByText('Upload Backup File')).toBeInTheDocument()
  })

  it('calls onRegenerateIdentity when sign button is clicked', () => {
    render(<IdentityAuthenticator {...defaultProps} />)
    fireEvent.click(screen.getByText('Sign with Wallet'))
    expect(defaultProps.onRegenerateIdentity).toHaveBeenCalled()
  })

  it('calls onFileUpload when file is selected', () => {
    render(<IdentityAuthenticator {...defaultProps} />)
    const file = new File(['{"identity": "test"}'], 'identity.json', { type: 'application/json' })
    const input = screen.getByTestId('identity-upload')
    
    fireEvent.change(input, { target: { files: [file] } })
    expect(defaultProps.onFileUpload).toHaveBeenCalled()
  })

  it('shows loading state for wallet signing', () => {
    render(<IdentityAuthenticator {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Signing...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /signing/i })).toBeDisabled()
  })

  it('shows loading state for file upload', () => {
    render(<IdentityAuthenticator {...defaultProps} isUploading={true} />)
    expect(screen.getByText('Verifying...')).toBeInTheDocument()
  })
})
