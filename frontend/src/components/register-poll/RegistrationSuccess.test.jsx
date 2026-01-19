import { render, screen, fireEvent } from '@testing-library/react'
import RegistrationSuccess from './RegistrationSuccess'

describe('RegistrationSuccess', () => {
  const defaultProps = {
    pollId: '123',
    registeredIdentity: null,
    isJustRegistered: false,
    onDownload: jest.fn(),
  }

  it('renders standard success message when NOT just registered', () => {
    (render(<RegistrationSuccess {...defaultProps} />))
    expect(screen.getByText('You are registered!')).toBeInTheDocument()
    expect(screen.queryByText('Download Backup (Optional)')).not.toBeInTheDocument()
  })

  it('renders fresh registration message when isJustRegistered is true', () => {
    render(
      <RegistrationSuccess 
        {...defaultProps} 
        isJustRegistered={true} 
        registeredIdentity={{ mock: 'identity' }}
      />
    )
    expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
    expect(screen.getByText('Download Backup (Optional)')).toBeInTheDocument()
  })


  it('calls onDownload when download button is clicked', () => {
    const mockIdentity = { id: 'test' }
    render(
      <RegistrationSuccess 
        {...defaultProps} 
        isJustRegistered={true} 
        registeredIdentity={mockIdentity}
      />
    )
    fireEvent.click(screen.getByText('Download Backup (Optional)'))
    expect(defaultProps.onDownload).toHaveBeenCalledWith(mockIdentity, '123')
  })
})
