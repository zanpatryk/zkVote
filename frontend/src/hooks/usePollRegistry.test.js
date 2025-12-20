import { renderHook } from '@testing-library/react'
import { usePollRegistry } from './usePollRegistry'
import { useReadContract, useAccount } from 'wagmi'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
  useReadContract: jest.fn(),
}))

jest.mock('@/lib/contracts/VotingSystemEngine', () => ({
  votingSystemContract: {
    address: '0xVotingSystem',
    abi: [],
  },
}))

describe('usePollRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAccount.mockReturnValue({ address: '0xUser' })
  })

  it('should return default values when loading or data missing', () => {
    // Mock sequential calls
    // 1. Eligibility Address -> loading/undefined
    useReadContract.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current).toEqual({
      isZK: false, // undefined depth treated as false
      isRegistered: false,
      merkleTreeDepth: 0,
      eligibilityModuleAddress: undefined
    })
  })

  it('should detect ZK poll correctly', () => {
    // Mock returns for the 3 sequential calls
    useReadContract
      .mockReturnValueOnce({ data: '0xEligibility' }) // address
      .mockReturnValueOnce({ data: 20n })           // depth > 0 (ZK)
      .mockReturnValueOnce({ data: false })         // isRegistered

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isZK).toBe(true)
    expect(result.current.merkleTreeDepth).toBe(20)
    expect(result.current.eligibilityModuleAddress).toBe('0xEligibility')
  })

  it('should detect non-ZK poll (depth 0)', () => {
    useReadContract
      .mockReturnValueOnce({ data: '0xEligibility' }) 
      .mockReturnValueOnce({ data: 0n })            // depth 0
      .mockReturnValueOnce({ data: false })         

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isZK).toBe(false)
    expect(result.current.merkleTreeDepth).toBe(0)
  })

  it('should detect registered status', () => {
    useReadContract
      .mockReturnValueOnce({ data: '0xEligibility' }) 
      .mockReturnValueOnce({ data: 20n }) 
      .mockReturnValueOnce({ data: true })          // registered

    const { result } = renderHook(() => usePollRegistry('123'))

    expect(result.current.isRegistered).toBe(true)
  })
})
