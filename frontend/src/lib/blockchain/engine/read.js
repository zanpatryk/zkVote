import { getPublicClient } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import PollManagerABI from '@/lib/contracts/abis/PollManager.json'
import EligibilityModuleABI from '@/lib/contracts/abis/EligibilityModuleV0.json'
import { parseAbiItem } from 'viem'

// Helper to get module addresses
async function getModules() {
  const publicClient = getPublicClient(config)
  const [pollManager, eligibilityModule, voteStorage] = await Promise.all([
    publicClient.readContract({
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 's_pollManager',
    }),
    publicClient.readContract({
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 's_eligibilityModule',
    }),
    publicClient.readContract({
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 's_voteStorage',
    }),
  ])
  return { pollManager, eligibilityModule, voteStorage }
}

export async function getPollById(pollId) {
  if (!pollId) return null
  const publicClient = getPublicClient(config)
  const { pollManager } = await getModules()

  try {
    // Fetch poll details from PollManager
    // struct Poll { uint256 pollId; address owner; string title; string description; string[] options; State state; }
    // But PollManager doesn't expose a single getPoll struct getter, it has individual getters.
    // We need to fetch fields individually or add a struct getter to PollManager (recommended).
    // Based on current PollManager.sol, we have:
    // getPollOwner, getPollTitle, getPollOptionCount, getPollOption, getDescription
    
    const [title, description, owner, optionCount] = await Promise.all([
      publicClient.readContract({ address: pollManager, abi: PollManagerABI, functionName: 'getPollTitle', args: [BigInt(pollId)] }),
      publicClient.readContract({ address: pollManager, abi: PollManagerABI, functionName: 'getDescription', args: [BigInt(pollId)] }),
      publicClient.readContract({ address: pollManager, abi: PollManagerABI, functionName: 'getPollOwner', args: [BigInt(pollId)] }),
      publicClient.readContract({ address: pollManager, abi: PollManagerABI, functionName: 'getPollOptionCount', args: [BigInt(pollId)] }),
    ])

    const options = []
    for (let i = 0; i < Number(optionCount); i++) {
      const opt = await publicClient.readContract({
        address: pollManager,
        abi: PollManagerABI,
        functionName: 'getPollOption',
        args: [BigInt(pollId), BigInt(i)],
      })
      options.push(opt)
    }

    return {
      pollId,
      title,
      description,
      creator: owner,
      options,
      // state: ... (need to fetch state if needed)
    }
  } catch (err) {
    console.error('getPollById failed:', err)
    return null
  }
}

export async function getOwnedPolls(address) {
  if (!address) return []
  const publicClient = getPublicClient(config)
  const { pollManager } = await getModules()

  try {
    const pollIds = await publicClient.readContract({
      address: pollManager,
      abi: PollManagerABI,
      functionName: 'getPolls',
      args: [address],
    })

    const polls = await Promise.all(
      pollIds.map(id => getPollById(id))
    )
    return polls
  } catch (err) {
    console.error('getOwnedPolls failed:', err)
    return []
  }
}

export async function getWhitelistedPolls(address) {
  if (!address) return []
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules()

  // Query events: EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)
  const logs = await publicClient.getLogs({
    address: eligibilityModule,
    event: parseAbiItem('event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)'),
    args: {
      user: address
    },
    fromBlock: 'earliest'
  })

  // Extract unique poll IDs
  const pollIds = [...new Set(logs.map(log => log.args.pollId))]

  const polls = await Promise.all(
    pollIds.map(id => getPollById(id))
  )
  return polls
}

export async function isUserWhitelisted(pollId, userAddress) {
  if (!pollId || !userAddress) return false
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules()

  return publicClient.readContract({
    address: eligibilityModule,
    abi: EligibilityModuleABI,
    functionName: 'isWhitelisted',
    args: [BigInt(pollId), userAddress],
  })
}

// NOTE: getVote and hasVoted are limited in V0
// hasVoted is internal in VoteStorageV0 (private s_hasVoted), not exposed via interface?
// Wait, VoteStorageV0 has `castVote` which checks `s_hasVoted`. 
// But IVoteStorage does NOT expose `hasVoted`. 
// We might need to add `hasVoted` to IVoteStorage and VoteStorageV0 to check from frontend.
// For now, we can't check if user has voted without trying to vote (which will revert).

export async function hasVoted(pollId, userAddress) {
    // TODO: Update VoteStorage to expose hasVoted
    console.warn('hasVoted is not yet implemented in VoteStorageV0')
    return false
}

export async function getVote(pollId, voteId) {
    // TODO: VoteStorageV0 does not store individual votes publicly
    console.warn('getVote is not supported in VoteStorageV0')
    return null
}
