import { getPublicClient } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract } from '@/lib/contracts'

/**
 * Fetches the addresses of the core modules (PollManager, Eligibility, VoteStorage) 
 * associated with the global voting system or a specific poll.
 * 
 * @param {string|number} [pollId] - The ID of the poll to fetch modules for. If omitted, returns system defaults.
 * @returns {Promise<{pollManager: string, eligibilityModule: string, voteStorage: string}>}
 */
export async function getModules(pollId) {
  try {
    const publicClient = getPublicClient(config)
    
    // pollManager is global
    const pollManager = await publicClient.readContract({
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 's_pollManager',
    })

    // Prepare read calls
    const readBase = [
        publicClient.readContract({ address: votingSystemContract.address, abi: votingSystemContract.abi, functionName: 's_defaultEligibility' }),
        publicClient.readContract({ address: votingSystemContract.address, abi: votingSystemContract.abi, functionName: 's_defaultVoteStorage' })
    ]

    if (pollId) {
        readBase.push(
            publicClient.readContract({ address: votingSystemContract.address, abi: votingSystemContract.abi, functionName: 's_pollEligibility', args: [BigInt(pollId)] }),
            publicClient.readContract({ address: votingSystemContract.address, abi: votingSystemContract.abi, functionName: 's_pollVoteStorage', args: [BigInt(pollId)] })
        )
    }

    const results = await Promise.all(readBase)
    const defaultEli = results[0]
    const defaultVote = results[1]
    
    let eligibilityModule = defaultEli
    let voteStorage = defaultVote

    if (pollId && results[2] && results[3]) {
        // results[2] = s_pollEligibility, results[3] = s_pollVoteStorage
        const pollEli = results[2]
        const pollVote = results[3]

        if (pollEli && pollEli !== '0x0000000000000000000000000000000000000000') {
            eligibilityModule = pollEli
        }
        if (pollVote && pollVote !== '0x0000000000000000000000000000000000000000') {
            voteStorage = pollVote
        }
    }

    return { pollManager, eligibilityModule, voteStorage }
  } catch (err) {
    console.error('getModules failed:', err)
    throw new Error('Failed to connect to blockchain. Please check your connection.')
  }
}
