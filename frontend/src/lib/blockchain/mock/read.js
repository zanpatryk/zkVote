import { getPublicClient } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemMockContract } from '@/lib/contracts/VotingSystemMock'
import { hexToString } from 'viem'

export async function getVoterPolls(address) {
  if (!address) return []

  const publicClient = getPublicClient(config)
  const pollIds = await publicClient.readContract({
    address: votingSystemMockContract.address,
    abi: votingSystemMockContract.abi,
    functionName: 'getVoterPolls',
    args: [address],
  })

  const polls = await Promise.all(
    pollIds.map(async (id) => {
      const data = await publicClient.readContract({
        address: votingSystemMockContract.address,
        abi: votingSystemMockContract.abi,
        functionName: 'getPoll',
        args: [id],
      })
      return { pollId: id, data }
    })
  )

  return polls
}

export async function getWhitelistedPolls(address) {
  if (!address) return []

  const publicClient = getPublicClient(config)

  // Get all poll IDs from the contract
  const allPollIds = await publicClient.readContract({
    address: votingSystemMockContract.address,
    abi: votingSystemMockContract.abi,
    functionName: 'getAllPolls',
  })

  const polls = []

  for (const id of allPollIds) {
    const whitelisted = await publicClient.readContract({
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'isWhitelisted',
      args: [id, address],
    })

    if (!whitelisted) continue

    const data = await publicClient.readContract({
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'getPoll',
      args: [id],
    })

    polls.push({ pollId: id, data })
  }

  return polls
}

export async function getPollById(pollId) {
  if (!pollId) return null

  const publicClient = getPublicClient(config)
  const raw = await publicClient.readContract({
    address: votingSystemMockContract.address,
    abi: votingSystemMockContract.abi,
    functionName: 'getPoll',
    args: [BigInt(pollId)],
  })

  // raw is bytes (0x-prefixed hex) encoded from JSON
  const json = hexToString(raw)

  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function isUserWhitelisted(pollId, userAddress) {
  if (!pollId || !userAddress) return false

  const publicClient = getPublicClient(config)
  const result = await publicClient.readContract({
    address: votingSystemMockContract.address,
    abi: votingSystemMockContract.abi,
    functionName: 'isWhitelisted',
    args: [BigInt(pollId), userAddress],
  })

  return result
}

export async function getOwnedPolls(address) {
  if (!address) return []

  const publicClient = getPublicClient(config)

  try {
    const pollIds = await publicClient.readContract({
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'getOwnedPolls',
      args: [address],
    })

    const polls = await Promise.all(
      pollIds.map(async (id) => {
        const data = await publicClient.readContract({
          address: votingSystemMockContract.address,
          abi: votingSystemMockContract.abi,
          functionName: 'getPoll',
          args: [id],
        })
        return { pollId: id, data }
      })
    )

    return polls
  } catch (err) {
    console.error('getOwnedPolls failed, treating as no polls:', err)
    return []
  }
}

export async function getVote(pollId, voteId) {
  if (!pollId || !voteId) return null

  const publicClient = getPublicClient(config)
  const raw = await publicClient.readContract({
    address: votingSystemMockContract.address,
    abi: votingSystemMockContract.abi,
    functionName: 'getVote',
    args: [BigInt(pollId), BigInt(voteId)],
  })

  // raw is bytes (0x-prefixed hex) encoded from JSON
  const json = hexToString(raw)

  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function hasVoted(pollId, userAddress) {
  if (!pollId || !userAddress) return false

  const publicClient = getPublicClient(config)
  const result = await publicClient.readContract({
    address: votingSystemMockContract.address,
    abi: votingSystemMockContract.abi,
    functionName: 'hasVoted',
    args: [BigInt(pollId), userAddress],
  })

  return result
}