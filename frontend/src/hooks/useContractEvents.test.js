'use client'

import { renderHook, act } from '@testing-library/react'
import { useContractEvents, useMultiContractEvents } from './useContractEvents'
import { useWatchContractEvent } from 'wagmi'

// Mock wagmi
jest.mock('wagmi', () => ({
  useWatchContractEvent: jest.fn(),
}))

// Mock viem
jest.mock('viem', () => ({
  parseAbiItem: jest.fn((sig) => ({ type: 'event', name: 'MockEvent', signature: sig })),
}))

describe('useContractEvents', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const mockEventSignature = 'event Transfer(address indexed from, address indexed to, uint256 value)'
  const mockEventName = 'Transfer'
  const mockParseLog = jest.fn((log) => ({
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    from: log.args?.from,
    to: log.args?.to,
    value: log.args?.value,
  }))

  let capturedOnLogs = null

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnLogs = null
    
    useWatchContractEvent.mockImplementation(({ onLogs }) => {
      capturedOnLogs = onLogs
    })
  })

  it('initializes with empty events by default', () => {
    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
      })
    )

    expect(result.current.events).toEqual([])
  })

  it('initializes with provided initial events', () => {
    const initialEvents = [
      { transactionHash: '0xaaa', blockNumber: 100 },
      { transactionHash: '0xbbb', blockNumber: 99 },
    ]

    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
        initialEvents,
      })
    )

    expect(result.current.events).toEqual(initialEvents)
  })

  it('calls useWatchContractEvent with correct parameters', () => {
    renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        args: { from: '0xSender' },
        parseLog: mockParseLog,
        enabled: true,
      })
    )

    expect(useWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        address: mockAddress,
        eventName: mockEventName,
        args: { from: '0xSender' },
        enabled: true,
      })
    )
  })

  it('disables watcher when address is not provided', () => {
    renderHook(() =>
      useContractEvents({
        address: undefined,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
        enabled: true,
      })
    )

    expect(useWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    )
  })

  it('adds new events when logs are received', () => {
    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
      })
    )

    const mockLogs = [
      { transactionHash: '0xaaa', blockNumber: 100, args: { from: '0x1', to: '0x2', value: 100n } },
      { transactionHash: '0xbbb', blockNumber: 101, args: { from: '0x3', to: '0x4', value: 200n } },
    ]

    act(() => {
      capturedOnLogs(mockLogs)
    })

    expect(result.current.events).toHaveLength(2)
    expect(mockParseLog).toHaveBeenCalledTimes(2)
  })

  it('deduplicates events by transaction hash', () => {
    const initialEvents = [{ transactionHash: '0xaaa', blockNumber: 100 }]

    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
        initialEvents,
      })
    )

    // Try to add a duplicate
    const duplicateLogs = [
      { transactionHash: '0xaaa', blockNumber: 100, args: {} },
    ]

    act(() => {
      capturedOnLogs(duplicateLogs)
    })

    // Should still have only 1 event
    expect(result.current.events).toHaveLength(1)
  })

  it('sorts events by block number (newest first)', () => {
    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
      })
    )

    const mockLogs = [
      { transactionHash: '0xold', blockNumber: 50, args: {} },
      { transactionHash: '0xnew', blockNumber: 200, args: {} },
      { transactionHash: '0xmid', blockNumber: 100, args: {} },
    ]

    act(() => {
      capturedOnLogs(mockLogs)
    })

    expect(result.current.events[0].blockNumber).toBe(200)
    expect(result.current.events[1].blockNumber).toBe(100)
    expect(result.current.events[2].blockNumber).toBe(50)
  })

  it('handles parse errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const badParseLog = jest.fn(() => {
      throw new Error('Parse failed')
    })

    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: badParseLog,
      })
    )

    const mockLogs = [{ transactionHash: '0xaaa', blockNumber: 100, args: {} }]

    act(() => {
      capturedOnLogs(mockLogs)
    })

    expect(result.current.events).toHaveLength(0)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse log:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('ignores empty log arrays', () => {
    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
      })
    )

    act(() => {
      capturedOnLogs([])
    })

    expect(result.current.events).toEqual([])
    expect(mockParseLog).not.toHaveBeenCalled()
  })

  it('ignores null/undefined logs', () => {
    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
      })
    )

    act(() => {
      capturedOnLogs(null)
    })

    act(() => {
      capturedOnLogs(undefined)
    })

    expect(result.current.events).toEqual([])
  })

  it('allows manual event updates via setEvents', () => {
    const { result } = renderHook(() =>
      useContractEvents({
        address: mockAddress,
        eventSignature: mockEventSignature,
        eventName: mockEventName,
        parseLog: mockParseLog,
      })
    )

    const manualEvents = [
      { transactionHash: '0xmanual', blockNumber: 999 },
    ]

    act(() => {
      result.current.setEvents(manualEvents)
    })

    expect(result.current.events).toEqual(manualEvents)
  })
})

describe('useMultiContractEvents', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const mockEventConfigs = [
    { eventSignature: 'event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)', eventName: 'VoteCasted', args: { pollId: 1n } },
    { eventSignature: 'event VoteCast(uint256 indexed pollId, address indexed voter, uint256 voteId)', eventName: 'VoteCast', args: { pollId: 1n } },
  ]
  const mockParseLog = jest.fn((log) => ({
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
  }))

  beforeEach(() => {
    jest.clearAllMocks()
    useWatchContractEvent.mockImplementation(() => {})
  })

  it('creates watchers for each event config', () => {
    renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
      })
    )

    // Should call useWatchContractEvent once per config
    expect(useWatchContractEvent).toHaveBeenCalledTimes(2)
    
    expect(useWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'VoteCasted',
        args: { pollId: 1n },
      })
    )
    
    expect(useWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'VoteCast',
        args: { pollId: 1n },
      })
    )
  })

  it('initializes with provided initial events', () => {
    const initialEvents = [{ transactionHash: '0xinitial', blockNumber: 1 }]

    const { result } = renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
        initialEvents,
      })
    )

    expect(result.current.events).toEqual(initialEvents)
  })

  it('disables all watchers when address is not provided', () => {
    renderHook(() =>
      useMultiContractEvents({
        address: undefined,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
      })
    )

    expect(useWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    )
  })

  it('adds new events when logs are received via handleLogs', () => {
    let capturedOnLogs = null
    useWatchContractEvent.mockImplementation(({ onLogs }) => {
      if (!capturedOnLogs) capturedOnLogs = onLogs
    })

    const { result } = renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
      })
    )

    const mockLogs = [
      { transactionHash: '0xaaa', blockNumber: 100 },
      { transactionHash: '0xbbb', blockNumber: 101 },
    ]

    act(() => {
      capturedOnLogs(mockLogs)
    })

    expect(result.current.events).toHaveLength(2)
  })

  it('deduplicates events in useMultiContractEvents', () => {
    let capturedOnLogs = null
    useWatchContractEvent.mockImplementation(({ onLogs }) => {
      if (!capturedOnLogs) capturedOnLogs = onLogs
    })

    const initialEvents = [{ transactionHash: '0xaaa', blockNumber: 100 }]

    const { result } = renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
        initialEvents,
      })
    )

    // Try to add a duplicate
    act(() => {
      capturedOnLogs([{ transactionHash: '0xaaa', blockNumber: 100 }])
    })

    expect(result.current.events).toHaveLength(1)
  })

  it('handles parse errors gracefully in useMultiContractEvents', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    let capturedOnLogs = null
    useWatchContractEvent.mockImplementation(({ onLogs }) => {
      if (!capturedOnLogs) capturedOnLogs = onLogs
    })

    const badParseLog = jest.fn(() => {
      throw new Error('Parse failed')
    })

    const { result } = renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: badParseLog,
      })
    )

    act(() => {
      capturedOnLogs([{ transactionHash: '0xaaa', blockNumber: 100 }])
    })

    expect(result.current.events).toHaveLength(0)
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse log:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('ignores empty log arrays in useMultiContractEvents', () => {
    let capturedOnLogs = null
    useWatchContractEvent.mockImplementation(({ onLogs }) => {
      if (!capturedOnLogs) capturedOnLogs = onLogs
    })

    const { result } = renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
      })
    )

    act(() => {
      capturedOnLogs([])
    })

    expect(result.current.events).toEqual([])
    expect(mockParseLog).not.toHaveBeenCalled()
  })

  it('sorts events by block number in useMultiContractEvents', () => {
    let capturedOnLogs = null
    useWatchContractEvent.mockImplementation(({ onLogs }) => {
      if (!capturedOnLogs) capturedOnLogs = onLogs
    })

    const { result } = renderHook(() =>
      useMultiContractEvents({
        address: mockAddress,
        eventConfigs: mockEventConfigs,
        parseLog: mockParseLog,
      })
    )

    const mockLogs = [
      { transactionHash: '0xold', blockNumber: 50 },
      { transactionHash: '0xnew', blockNumber: 200 },
      { transactionHash: '0xmid', blockNumber: 100 },
    ]

    act(() => {
      capturedOnLogs(mockLogs)
    })

    expect(result.current.events[0].blockNumber).toBe(200)
    expect(result.current.events[1].blockNumber).toBe(100)
    expect(result.current.events[2].blockNumber).toBe(50)
  })
})
