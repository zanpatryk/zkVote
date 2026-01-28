import { getPublicClient, getAccount } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract, getAddresses } from '@/lib/contracts'

// Simple memory cache to prevent redundant RPC calls within a short window
export const modulesCache = new Map()
const CACHE_TTL = 5000 // 5 seconds

/**
 * Fetches the addresses of the core modules (PollManager, Eligibility, VoteStorage) 
 * associated with the global voting system or a specific poll.
 * 
 * @param {string|number} [pollId] - The ID of the poll to fetch modules for. If omitted, returns system defaults.
 * @returns {Promise<{pollManager: string, eligibilityModule: string, voteStorage: string}>}
 */
export async function getModules(pollId) {
  const cacheKey = pollId ? `poll-${pollId}` : 'system'
  const cached = modulesCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const account = getAccount(config)
    const currentChainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = getPublicClient(config, { chainId: currentChainId })
    const addresses = getAddresses(currentChainId)

    const calls = [
      {
        address: addresses.vse,
        abi: votingSystemContract.abi,
        functionName: 's_pollManager',
      },
      {
        address: addresses.vse,
        abi: votingSystemContract.abi,
        functionName: 's_defaultEligibility',
      },
      {
        address: addresses.vse,
        abi: votingSystemContract.abi,
        functionName: 's_defaultVoteStorage',
      }
    ]

    if (pollId) {
      calls.push(
        {
          address: addresses.vse,
          abi: votingSystemContract.abi,
          functionName: 's_pollEligibility',
          args: [BigInt(pollId)],
        },
        {
          address: addresses.vse,
          abi: votingSystemContract.abi,
          functionName: 's_pollVoteStorage',
          args: [BigInt(pollId)],
        }
      )
    }

    const results = await publicClient.multicall({
      contracts: calls,
      allowFailure: false, // Core infrastructure must succeed
    })

    const pollManager = results[0]
    let eligibilityModule = results[1]
    let voteStorage = results[2]

    if (pollId && results[3] && results[4]) {
      const pollEli = results[3]
      const pollVote = results[4]

      if (pollEli && pollEli !== '0x0000000000000000000000000000000000000000') {
        eligibilityModule = pollEli
      }
      if (pollVote && pollVote !== '0x0000000000000000000000000000000000000000') {
        voteStorage = pollVote
      }
    }

    const data = { pollManager, eligibilityModule, voteStorage }
    modulesCache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  } catch (err) {
    console.error('getModules failed:', err)
    throw new Error('Failed to connect to blockchain infrastructure. Please check your internet connection and try again.')
  }
}
