import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import IdentityFileUploader from './IdentityFileUploader'
import '@testing-library/jest-dom'
import { Identity } from '@semaphore-protocol/identity'
import { toast } from 'react-hot-toast'

// Mock Identity
jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock File.text
const originalFileText = File.prototype.text
beforeAll(() => {
  File.prototype.text = jest.fn(function() {
    return Promise.resolve(this._content || new Blob([this]).text())
  })
})
afterAll(() => {
  File.prototype.text = originalFileText
})

describe('IdentityFileUploader', () => {
  const mockOnIdentityParsed = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload area', () => {
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    expect(screen.getByText('Upload Identity JSON')).toBeInTheDocument()
  })

  it('parses valid identity file', async () => {
    Identity.mockImplementation(() => ({ commitment: '123' }))
    
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    
    const file = new File([''], 'identity.json', { type: 'application/json' })
    file._content = JSON.stringify({ pollId: '123', secret: 'my-secret' })
    
    const input = document.getElementById('common-identity-upload')
    
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
        expect(Identity).toHaveBeenCalledWith('my-secret')
        expect(mockOnIdentityParsed).toHaveBeenCalledWith({ 
            identity: { commitment: '123' }, 
            pollId: '123',
            json: expect.any(Object)
        })
    })
  })

  it('shows error for invalid file (missing secret)', async () => {
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    
    const file = new File([''], 'identity.json', { type: 'application/json' })
    file._content = JSON.stringify({ pollId: '123' }) // No secret
    
    const input = document.getElementById('common-identity-upload')
    
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
    })

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid identity file: Missing private key')
        expect(mockOnIdentityParsed).not.toHaveBeenCalled()
    })
  })

  it('shows error for invalid file extension', async () => {
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    
    const file = new File([''], 'identity.txt', { type: 'text/plain' })
    const input = document.getElementById('common-identity-upload')
    
    await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
    })

    expect(toast.error).toHaveBeenCalledWith('Please upload a valid JSON identity file')
  })

  it('handles drag over and leave events', () => {
    const { container } = render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    const dropzone = container.firstChild

    fireEvent.dragOver(dropzone)
    expect(dropzone).toHaveClass('border-black')

    fireEvent.dragLeave(dropzone)
    expect(dropzone).not.toHaveClass('border-black')
  })

  it('handles file drop', async () => {
    Identity.mockImplementation(() => ({ commitment: '123' }))
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    
    const file = new File([''], 'identity.json', { type: 'application/json' })
    file._content = JSON.stringify({ pollId: '123', secret: 'my-secret' })
    
    const dropzone = screen.getByText('Upload Identity JSON').closest('div')
    
    await act(async () => {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file]
        }
      })
    })

    await waitFor(() => {
      expect(Identity).toHaveBeenCalledWith('my-secret')
      expect(mockOnIdentityParsed).toHaveBeenCalled()
    })
  })

  it('triggers file input click when area is clicked', () => {
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} />)
    const input = document.getElementById('common-identity-upload')
    const spy = jest.spyOn(input, 'click')
    
    // Target the main container div
    const dropzone = screen.getByText('Upload Identity JSON').closest('div')
    fireEvent.click(dropzone)
    
    expect(spy).toHaveBeenCalled()
  })

  it('shows loading state when isVerifying is true', () => {
    render(<IdentityFileUploader onIdentityParsed={mockOnIdentityParsed} isVerifying={true} />)
    expect(screen.getByText('Verifying Identity...')).toBeInTheDocument()
    
    const dropzone = screen.getByText('Verifying Identity...').closest('div')
    expect(dropzone).toHaveClass('opacity-50')
    expect(dropzone).toHaveClass('pointer-events-none')
  })
})
