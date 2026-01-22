import { renderHook } from '@testing-library/react'
import { usePollRegistry } from './usePollRegistry'
import { useReadContract, useReadContracts, useAccount } from 'wagmi'
import { votingSystemContract } from '@/lib/contracts'

// Explicit local mock to override any global issues
// ...

  it('should detect non-ZK poll (depth 0)', () => {
    useReadContract
      .mockReturnValueOnce({ data: 0n })            // depth 0
      .mockReturnValueOnce({ data: false })         
      .mockReturnValueOnce({ data: 1 })   

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isZK).toBe(false)
    expect(result.current.merkleTreeDepth).toBe(0)
  })

// Explicit local mock to override any global issues
jest.mock('wagmi', () => {
  const mock = {
    useAccount: jest.fn(() => ({ address: '0xUser' })),
    useReadContract: jest.fn(),
    useReadContracts: jest.fn(() => ({ 
      data: [
        { result: '0xEligibility' }, // Default Eli
        { result: '0x0000000000000000000000000000000000000000' }, // Poll Eli (empty)
        { result: '0xVoteStorage' }, // Default Vote
        { result: '0x0000000000000000000000000000000000000000' } // Poll Vote (empty)
      ], 
      isLoading: false 
    })),
  }
  return {
    __esModule: true,
    ...mock,
    default: mock,
  }
})

jest.mock('@/lib/contracts', () => ({
  votingSystemContract: {
    address: '0xVotingSystem',
    abi: [],
  },
  ZKElGamalVoteVectorABI: [],
  SemaphoreEligibilityModuleABI: [],
}))

describe('usePollRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAccount.mockReturnValue({ address: '0xUser' })
  })

  it('should return default values when loading or data missing', () => {
    // Override plural hook to return empty
    useReadContracts.mockReturnValue({ data: [], isLoading: true })
    useReadContract.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current).toEqual(expect.objectContaining({
      isZK: false,
      isRegistered: false,
      merkleTreeDepth: 0,
    }))
  })

  it('should detect ZK poll correctly', () => {
    // Reset plural hook to default (valid addresses)
    useReadContracts.mockReturnValue({ 
      data: [
        { result: '0xEligibility' }, 
        { result: '0x0000000000000000000000000000000000000000' },
        { result: '0xVoteStorage' },
        { result: '0x0000000000000000000000000000000000000000' }
      ], 
      isLoading: false 
    })

    // Mock returns for the 3 sequential calls (depth, isRegistered, pollState)
    useReadContract
      .mockReturnValueOnce({ data: 20n })           // depth > 0 (ZK)
      .mockReturnValueOnce({ data: false })         // isRegistered
      .mockReturnValueOnce({ data: 1 })             // state

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isZK).toBe(true)
    expect(result.current.merkleTreeDepth).toBe(20)
    expect(result.current.eligibilityModuleAddress).toBe('0xEligibility')
  })

  it('should detect non-ZK poll (depth 0)', () => {
    useReadContract
      .mockReturnValueOnce({ data: 0n })            // depth 0
      .mockReturnValueOnce({ data: false })         
      .mockReturnValueOnce({ data: 1 })   

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isZK).toBe(false)
    expect(result.current.merkleTreeDepth).toBe(0)
  })

  it('should detect registered status', () => {
    useReadContract
      .mockReturnValueOnce({ data: 20n }) 
      .mockReturnValueOnce({ data: true })          // registered
      .mockReturnValueOnce({ data: 1 })   

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isRegistered).toBe(true)
  })
})
