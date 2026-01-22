import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KeyGenerator from './KeyGenerator'
import { elgamal } from '@zkvote/lib'
import { toast } from 'react-hot-toast'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

jest.mock('@zkvote/lib', () => ({
  elgamal: {
    init: jest.fn(),
    generateKeyPair: jest.fn(),
  },
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('KeyGenerator', () => {
  const mockSetGeneratedKeys = jest.fn()
  const mockSetHasSavedKey = jest.fn()
  const defaultProps = {
    generatedKeys: null,
    setGeneratedKeys: mockSetGeneratedKeys,
    hasSavedKey: false,
    setHasSavedKey: mockSetHasSavedKey,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
    })
  })

  it('renders generate button when no keys generated', () => {
    render(<KeyGenerator {...defaultProps} />)
    expect(screen.getByText(/Generate Encryption Keys/i)).toBeInTheDocument()
  })

  it('calls elgamal init and generateKeyPair on button click', async () => {
    elgamal.init.mockResolvedValue(true)
    elgamal.generateKeyPair.mockReturnValue({
      sk: 'sk-123',
      pk: ['pk-1', 'pk-2'],
    })

    render(<KeyGenerator {...defaultProps} />)
    fireEvent.click(screen.getByText(/Generate Encryption Keys/i))

    await waitFor(() => {
      expect(elgamal.init).toHaveBeenCalled()
      expect(elgamal.generateKeyPair).toHaveBeenCalled()
      expect(mockSetGeneratedKeys).toHaveBeenCalledWith({
        sk: 'sk-123',
        pk: ['pk-1', 'pk-2'],
      })
      expect(toast.success).toHaveBeenCalledWith('Encryption keys generated!')
    })
  })

  it('renders keys and checkbox when keys are generated', () => {
    const generatedKeys = { sk: 'secret-key-123', pk: ['public-key-1', 'public-key-2'] }
    render(<KeyGenerator {...defaultProps} generatedKeys={generatedKeys} />)
    
    expect(screen.getByText('secret-key-123')).toBeInTheDocument()
    expect(screen.getByText(/\[public-key-1, public-key-2\]/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/I have saved my secret key securely/i)).toBeInTheDocument()
  })

  it('copies secret key to clipboard on copy button click', () => {
    const generatedKeys = { sk: 'secret-key-123', pk: ['pk1', 'pk2'] }
    render(<KeyGenerator {...defaultProps} generatedKeys={generatedKeys} />)
    
    fireEvent.click(screen.getByText(/Copy/i))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('secret-key-123')
    expect(toast.success).toHaveBeenCalledWith('Copied to clipboard')
  })

  it('calls setHasSavedKey on checkbox change', () => {
    const generatedKeys = { sk: 'sk', pk: ['pk1', 'pk2'] }
    render(<KeyGenerator {...defaultProps} generatedKeys={generatedKeys} />)
    
    const checkbox = screen.getByLabelText(/I have saved my secret key securely/i)
    fireEvent.click(checkbox)
    expect(mockSetHasSavedKey).toHaveBeenCalledWith(true)
  })

  it('handles generation error', async () => {
    elgamal.init.mockRejectedValue(new Error('init failed'))
    render(<KeyGenerator {...defaultProps} />)
    
    fireEvent.click(screen.getByText(/Generate Encryption Keys/i))
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to generate keys')
    })
  })
})
