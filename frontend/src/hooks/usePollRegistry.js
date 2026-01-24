import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getModules, getMerkleTreeDepth, isUserRegistered, getZKPollState } from '@/lib/blockchain/engine/read'

export function usePollRegistry(pollId) {
  const { address } = useAccount()

  // 1. Fetch Modules
  const { data: modules, isLoading: isLoadingModules } = useQuery({
    queryKey: ['pollModules', pollId?.toString()],
    queryFn: () => getModules(pollId),
    enabled: !!pollId
  })

  const eligibilityModuleAddress = modules?.eligibilityModule
  const voteStorageAddress = modules?.voteStorage

  // 2. Check ZK Depth
  const { data: depthData } = useQuery({
    queryKey: ['merkleDepth', pollId?.toString()],
    queryFn: () => getMerkleTreeDepth(pollId),
    enabled: !!pollId
  })
  const merkleTreeDepth = depthData?.data || 0
  const isZK = merkleTreeDepth > 0

  // 3. User Registration
  const { data: regData, refetch: refetchRegistration } = useQuery({
    queryKey: ['isRegistered', pollId?.toString(), address],
    queryFn: () => isUserRegistered(pollId, address),
    enabled: !!pollId && !!address && !!eligibilityModuleAddress
  })
  const isRegistered = !!regData?.data

  // 4. Poll State (Results Published)
  const { data: stateData, refetch: refetchPollState } = useQuery({
    queryKey: ['zkPollState', pollId?.toString()],
    queryFn: () => getZKPollState(pollId),
    enabled: !!pollId && isZK && !!voteStorageAddress
  })
  const resultsPublished = stateData?.data?.resultsPublished || false

  return {
    isZK,
    isRegistered,
    resultsPublished,
    merkleTreeDepth,
    eligibilityModuleAddress,
    voteStorageAddress,
    isLoading: isLoadingModules,
    refetchRegistration,
    refetchPollState
  }
}
