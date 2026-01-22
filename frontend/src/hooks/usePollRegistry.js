import { useReadContract, useReadContracts, useAccount } from 'wagmi'
import { 
  votingSystemContract, 
  ZKElGamalVoteVectorABI, 
  SemaphoreEligibilityModuleABI 
} from '@/lib/contracts'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function usePollRegistry(pollId) {
  const { address } = useAccount()

  // 1. Fetch Module Addresses (Default & Poll-Specific)
  const { data: moduleData, isLoading: isLoadingModules } = useReadContracts({
    contracts: [
      {
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_defaultEligibility',
      },
      {
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_pollEligibility',
        args: [BigInt(pollId || 0)],
      },
      {
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_defaultVoteStorage',
      },
      {
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_pollVoteStorage',
        args: [BigInt(pollId || 0)],
      }
    ],
    query: { enabled: !!pollId }
  })

  const [defaultEliResult, pollEliResult, defaultVoteResult, pollVoteResult] = moduleData || []
  
  const eligibilityModuleAddress = (pollEliResult?.result && pollEliResult.result !== ZERO_ADDRESS) 
    ? pollEliResult.result 
    : defaultEliResult?.result

  const voteStorageAddress = (pollVoteResult?.result && pollVoteResult.result !== ZERO_ADDRESS)
    ? pollVoteResult.result
    : defaultVoteResult?.result

  // 2. Check if Poll is ZK (depth > 0)
  const { data: merkleTreeDepth } = useReadContract({
    address: eligibilityModuleAddress,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'getMerkleTreeDepth',
    args: [BigInt(pollId || 0)],
    query: { 
        enabled: !!eligibilityModuleAddress && !!pollId && eligibilityModuleAddress !== ZERO_ADDRESS,
        retry: false
    }
  })

  // 3. Check if user is already registered
  const { data: isRegistered, refetch: refetchRegistration } = useReadContract({
    address: eligibilityModuleAddress,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'isRegistered',
    args: [BigInt(pollId || 0), address],
    query: { 
        enabled: !!eligibilityModuleAddress && !!address && !!pollId && eligibilityModuleAddress !== ZERO_ADDRESS,
        retry: false
    }
  })

  const isZK = Number(merkleTreeDepth || 0) > 0

  // 4. Check results published (for ZK polls)
  const { data: pollsState, refetch: refetchPollState } = useReadContract({
    address: voteStorageAddress,
    abi: ZKElGamalVoteVectorABI,
    functionName: 'polls', // returns tuple
    args: [BigInt(pollId || 0)],
    query: {
        enabled: !!voteStorageAddress && voteStorageAddress !== ZERO_ADDRESS && isZK,
        retry: false
    }
  })
  
  // pollsState is [initialized, voteCount, resultsPublished, ...]
  const resultsPublished = pollsState ? pollsState[2] : false

  return {
    isZK,
    isRegistered: !!isRegistered,
    resultsPublished,
    merkleTreeDepth: merkleTreeDepth ? Number(merkleTreeDepth) : 0,
    eligibilityModuleAddress,
    voteStorageAddress,
    isLoading: isLoadingModules,
    refetchRegistration,
    refetchPollState
  }
}
