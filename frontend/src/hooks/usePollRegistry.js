import { useReadContract, useAccount } from 'wagmi'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import SemaphoreEligibilityModuleABI from '@/lib/contracts/abis/SemaphoreEligibilityModule.json'

export function usePollRegistry(pollId) {
  const { address } = useAccount()

  // 1. Get Eligibility Module Address
  const { data: eligibilityModuleAddress } = useReadContract({
    address: votingSystemContract.address,
    abi: votingSystemContract.abi,
    functionName: 's_eligibilityModule',
  })

  // 2. Check if Poll is ZK (depth > 0)
  const { data: merkleTreeDepth } = useReadContract({
    address: eligibilityModuleAddress,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'getMerkleTreeDepth',
    args: [BigInt(pollId || 0)],
    query: { enabled: !!eligibilityModuleAddress && !!pollId }
  })

  // 3. Check if user is already registered
  const { data: isRegistered } = useReadContract({
    address: eligibilityModuleAddress,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'isRegistered',
    args: [BigInt(pollId || 0), address],
    query: { enabled: !!eligibilityModuleAddress && !!address && !!merkleTreeDepth && Number(merkleTreeDepth) > 0 }
  })

  const isZK = Number(merkleTreeDepth || 0) > 0

  return {
    isZK,
    isRegistered: !!isRegistered,
    merkleTreeDepth: merkleTreeDepth ? Number(merkleTreeDepth) : 0,
    eligibilityModuleAddress
  }
}
