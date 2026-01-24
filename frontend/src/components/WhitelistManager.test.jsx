import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WhitelistManager from './WhitelistManager'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import * as write from '@/lib/blockchain/engine/write'
import * as read from '@/lib/blockchain/engine/read'

// Mocks
jest.mock('@/lib/blockchain/engine/write', () => ({
  whitelistUser: jest.fn(),
  whitelistUsers: jest.fn()
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  isUserWhitelisted: jest.fn()
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn()
}))

jest.mock('viem', () => ({
  isAddress: jest.fn(addr => addr === '0x1234567890123456789012345678901234567890')
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}))

jest.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button', form: 'form' },
  AnimatePresence: ({ children }) => children
}))

describe('WhitelistManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAccount.mockReturnValue({ isConnected: true })
    read.isUserWhitelisted.mockResolvedValue({ data: false, error: null })
  })

  it('validates address format', async () => {
    render(<WhitelistManager pollId="123" pollState={0} />)
    const input = screen.getByPlaceholderText('0x...')
    const button = screen.getByText('Whitelist Address')

    fireEvent.change(input, { target: { value: 'invalid-address' } })
    fireEvent.click(button)

    expect(toast.error).toHaveBeenCalledWith('Please enter a valid wallet address.')
    expect(write.whitelistUser).not.toHaveBeenCalled()
  })

  it('prevents adding already whitelisted user', async () => {
    read.isUserWhitelisted.mockResolvedValueOnce({ data: true, error: null })
    render(<WhitelistManager pollId="123" pollState={0} />)
    const validAddress = '0x1234567890123456789012345678901234567890'
    const input = screen.getByPlaceholderText('0x...')
    const button = screen.getByText('Whitelist Address')

    fireEvent.change(input, { target: { value: 'invalid-address' } })
    fireEvent.change(input, { target: { value: validAddress } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(read.isUserWhitelisted).toHaveBeenCalledWith('123', validAddress)
    })
    
    expect(toast.error).toHaveBeenCalledWith('User is already whitelisted.')
    expect(write.whitelistUser).not.toHaveBeenCalled()
  })

  it('calls whitelistUser on valid single submission', async () => {
    render(<WhitelistManager pollId="123" pollState={0} />)
    const validAddress = '0x1234567890123456789012345678901234567890'
    const input = screen.getByPlaceholderText('0x...')
    const button = screen.getByText('Whitelist Address')

    fireEvent.change(input, { target: { value: validAddress } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(write.whitelistUser).toHaveBeenCalledWith('123', validAddress)
    })
  })

  it('calls onSuccess after successful single submission', async () => {
    const onSuccess = jest.fn()
    render(<WhitelistManager pollId="123" pollState={0} onSuccess={onSuccess} />)
    const validAddress = '0x1234567890123456789012345678901234567890'
    
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: validAddress } })
    fireEvent.click(screen.getByText('Whitelist Address'))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('renders in demo mode without errors', () => {
    render(<WhitelistManager pollId="123" pollState={0} demo={true} />)
    expect(screen.getByText('Single Address')).toBeInTheDocument()
    expect(screen.getByText('Batch Upload')).toBeInTheDocument()
  })

  it('does not call whitelistUser in demo mode', () => {
    render(<WhitelistManager pollId="123" pollState={0} demo={true} />)
    
    fireEvent.click(screen.getByText('Whitelist Address'))
    expect(write.whitelistUser).not.toHaveBeenCalled()
  })

  it('switches between single and batch mode', () => {
    render(<WhitelistManager pollId="123" pollState={0} />)
    
    fireEvent.click(screen.getByText('Batch Upload'))
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Single Address'))
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument()
  })

  it('handles whitelistUser error gracefully', async () => {
    write.whitelistUser.mockRejectedValueOnce({ shortMessage: 'Transaction failed' })
    
    render(<WhitelistManager pollId="123" pollState={0} />)
    const validAddress = '0x1234567890123456789012345678901234567890'
    
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: validAddress } })
    fireEvent.click(screen.getByText('Whitelist Address'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Transaction failed')
    })
  })

  it('shows error when not connected and trying to submit', () => {
    useAccount.mockReturnValue({ isConnected: false })
    render(<WhitelistManager pollId="123" pollState={0} />)
    const validAddress = '0x1234567890123456789012345678901234567890'
    
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: validAddress } })
    fireEvent.click(screen.getByText('Whitelist Address'))

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
  })

  it('disables input when poll is not in created state', () => {
    render(<WhitelistManager pollId="123" pollState={1} />)
    const input = screen.getByPlaceholderText('Whitelisting closed')
    expect(input).toBeDisabled()
  })
})
