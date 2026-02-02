import { renderHook, act, waitFor } from '@testing-library/react'
import { useRegistrationFlow } from './useRegistrationFlow'
import { useAccount } from 'wagmi'
import { usePoll } from './usePolls'
import { usePollRegistry } from './usePollRegistry'
import { useSemaphore } from './useSemaphore'
import { toast } from 'react-hot-toast'
import React from 'react'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('./usePolls', () => ({
  usePoll: jest.fn(),
}))

jest.mock('./usePollRegistry', () => ({
  usePollRegistry: jest.fn(),
}))

jest.mock('./useSemaphore', () => ({
  useSemaphore: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('useRegistrationFlow', () => {
  const mockPollId = '123'
  const mockPollData = { id: mockPollId, title: 'Test Poll' }
  const mockCreateIdentity = jest.fn()
  const mockRegister = jest.fn()
  const mockDownloadIdentity = jest.fn()
  const mockRefetchRegistration = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    useAccount.mockReturnValue({ isConnected: true })
    usePoll.mockReturnValue({ poll: mockPollData, isLoading: false, error: null })
    usePollRegistry.mockReturnValue({ isRegistered: false, refetchRegistration: mockRefetchRegistration })
    useSemaphore.mockReturnValue({
      createIdentity: mockCreateIdentity,
      register: mockRegister,
      downloadIdentity: mockDownloadIdentity,
      isLoadingIdentity: false,
      isRegistering: false
    })
  })

  it('initialized with correct default values', () => {
    const { result } = renderHook(() => useRegistrationFlow(mockPollId))

    expect(result.current.poll).toEqual(mockPollData)
    expect(result.current.isRegistered).toBe(false)
    expect(result.current.registeredIdentity).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('handles registration success', async () => {
    const mockIdentity = { commitment: 'comm123' }
    mockCreateIdentity.mockResolvedValue(mockIdentity)
    mockRegister.mockResolvedValue(true)

    const { result } = renderHook(() => useRegistrationFlow(mockPollId))

    await act(async () => {
      await result.current.handleRegister()
    })

    expect(mockCreateIdentity).toHaveBeenCalledWith(mockPollId)
    expect(mockRegister).toHaveBeenCalledWith(mockPollId, mockIdentity)
    expect(mockRefetchRegistration).toHaveBeenCalled()
    expect(result.current.registeredIdentity).toEqual(mockIdentity)
  })

  it('blocks registration if not connected', async () => {
    useAccount.mockReturnValue({ isConnected: false })
    const { result } = renderHook(() => useRegistrationFlow(mockPollId))

    await act(async () => {
      await result.current.handleRegister()
    })

    expect(toast.error).toHaveBeenCalledWith('Please connect your wallet first')
    expect(mockCreateIdentity).not.toHaveBeenCalled()
  })

  it('handles registration failure', async () => {
    mockCreateIdentity.mockRejectedValue(new Error('Sign failed'))
    const { result } = renderHook(() => useRegistrationFlow(mockPollId))

    await act(async () => {
      await result.current.handleRegister()
    })

    expect(toast.error).toHaveBeenCalledWith('Sign failed')
    expect(result.current.registeredIdentity).toBeNull()
  })

  it('handles empty identity return', async () => {
    mockCreateIdentity.mockResolvedValue(null)
    const { result } = renderHook(() => useRegistrationFlow(mockPollId))

    await act(async () => {
      await result.current.handleRegister()
    })

    expect(mockRegister).not.toHaveBeenCalled()
  })
})
