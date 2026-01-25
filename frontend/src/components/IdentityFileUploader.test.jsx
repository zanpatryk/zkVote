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
    
    // Find input by ID since it's hidden
    // We can use container query or get by label if label existed, but here we have onClick div.
    // The input is hidden inside the div.
    // We can query selector.
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
})
