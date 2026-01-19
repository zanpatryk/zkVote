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
    read.isUserWhitelisted.mockResolvedValue(false)
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
    read.isUserWhitelisted.mockResolvedValueOnce(true)
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
})
