import { getPublicClient } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { parseAbiItem } from 'viem'
import { 
  votingSystemContract, 
  CONTRACT_ADDRESSES,
  PollManagerABI,
  SemaphoreEligibilityModuleABI,
  ResultNFTABI,
  IVoteStorageABI,
  VoteStorageV0ABI,
  ZKElGamalVoteVectorABI
} from '@/lib/contracts'

/**
 * Fetches the addresses of the core modules (PollManager, Eligibility, VoteStorage) 
 * associated with the global voting system or a specific poll.
 * 
 * @param {string|number} [pollId] - The ID of the poll to fetch modules for. If omitted, returns system defaults.
 * @returns {Promise<{pollManager: string, eligibilityModule: string, voteStorage: string}>}
 */
export async function getModules(pollId) {
  const publicClient = getPublicClient(config)
  
  // pollManager is global
  const pollManager = await publicClient.readContract({
    address: votingSystemContract.address,
    abi: votingSystemContract.abi,
    functionName: 's_pollManager',
  })

  let eligibilityModule, voteStorage

  if (pollId) {
    // Get poll-specific modules
    const [e, v] = await Promise.all([
      publicClient.readContract({
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_pollEligibility',
        args: [BigInt(pollId)],
      }),
      publicClient.readContract({
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_pollVoteStorage',
        args: [BigInt(pollId)],
      })
    ])
    eligibilityModule = e
    voteStorage = v
  } else {
    // Fallback to global defaults
    const [e, v] = await Promise.all([
      publicClient.readContract({
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_defaultEligibility',
      }),
      publicClient.readContract({
        address: votingSystemContract.address,
        abi: votingSystemContract.abi,
        functionName: 's_defaultVoteStorage',
      })
    ])
    eligibilityModule = e
    voteStorage = v
  }

  return { pollManager, eligibilityModule, voteStorage }
}

/**
 * Fetches a poll's basic metadata (title, options, state, etc.) by its ID.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @returns {Promise<Object|null>} The poll data object or null if not found.
 */
export async function getPollById(pollId) {
  if (!pollId) return null
  const publicClient = getPublicClient(config)
  const { pollManager } = await getModules(pollId)

  try {
    const [id, owner, title, description, options, state] = await publicClient.readContract({
      address: pollManager,
      abi: PollManagerABI,
      functionName: 'getPoll',
      args: [BigInt(pollId)],
    })

    return {
      pollId: id.toString(),
      title,
      description,
      creator: owner,
      options: [...options],
      state: state
    }
  } catch (err) {
    console.error('getPollById failed:', err)
    return null
  }
}

/**
 * Fetches all polls created by a specific address.
 * 
 * @param {string} address - The wallet address of the poll creator.
 * @returns {Promise<Array>} A list of poll objects.
 */
export async function getOwnedPolls(address) {
  if (!address) return []
  const publicClient = getPublicClient(config)
  const { pollManager } = await getModules() // Global manager is fine

  try {
    // Query events: PollCreated(uint256 indexed pollId, address indexed creator)
    const logs = await publicClient.getLogs({
      address: pollManager,
      event: parseAbiItem('event PollCreated(uint256 indexed pollId, address indexed creator)'),
      args: {
        creator: address
      },
      fromBlock: 'earliest'
    })

    const pollIds = logs.map(log => log.args.pollId)

    const polls = await Promise.all(
      pollIds.map(id => getPollById(id))
    )
    return polls
  } catch (err) {
    console.error('getOwnedPolls failed:', err)
    return []
  }
}

/**
 * Fetches all polls where the given address is whitelisted/eligible to vote.
 * Scans both standard and V0 eligibility modules.
 * 
 * @param {string} address - The wallet address of the voter.
 * @returns {Promise<Array>} A list of poll objects.
 */
export async function getWhitelistedPolls(address) {
  if (!address) return []
  const publicClient = getPublicClient(config)
  
  // We check all known eligibility modules for whitelisting events
  const modulesToQuery = [
    CONTRACT_ADDRESSES.eligibilityV0,
    CONTRACT_ADDRESSES.semaphoreEligibility
  ].filter(Boolean)

  try {
    const allLogs = await Promise.all(
      modulesToQuery.flatMap(moduleAddr => [
        publicClient.getLogs({
          address: moduleAddr,
          event: parseAbiItem('event Whitelisted(address indexed user, uint256 indexed pollId)'),
          args: { user: address },
          fromBlock: 'earliest'
        }).catch(() => []),
        publicClient.getLogs({
          address: moduleAddr,
          event: parseAbiItem('event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)'),
          args: { user: address },
          fromBlock: 'earliest'
        }).catch(() => [])
      ])
    )

    const logs = allLogs.flat()
    const pollIds = [...new Set(logs.map(log => log.args.pollId))]

    const polls = await Promise.all(
      pollIds.map(id => getPollById(id))
    )
    return polls
  } catch (err) {
    console.error('getWhitelistedPolls failed:', err)
    return []
  }
}

/**
 * Fetches the list of whitelisted addresses for a specific poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {number|string} [fromBlock] - Start block for event logs.
 * @param {number|string} [toBlock] - End block for event logs.
 * @returns {Promise<string[]>} List of whitelisted wallet addresses.
 */
export async function getWhitelistedAddresses(pollId, fromBlock, toBlock) {
    if (!pollId) return []
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules(pollId)
  
    try {
      const [logsStandard, logsV0] = await Promise.all([
        publicClient.getLogs({
          address: eligibilityModule,
          event: parseAbiItem('event Whitelisted(address indexed user, uint256 indexed pollId)'),
          args: { pollId: BigInt(pollId) },
          fromBlock: fromBlock || 'earliest',
          toBlock: toBlock || 'latest'
        }).catch(() => []),
        publicClient.getLogs({
          address: eligibilityModule,
          event: parseAbiItem('event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)'),
          args: { pollId: BigInt(pollId) },
          fromBlock: fromBlock || 'earliest',
          toBlock: toBlock || 'latest'
        }).catch(() => [])
      ])
  
      const logs = [...logsStandard, ...logsV0]
      return logs.map(log => log.args.user)
    } catch (err) {
      console.error('getWhitelistedAddresses failed:', err)
      return []
    }
  }

/**
 * Fetches the Merkle Tree depth for a Semaphore-based poll.
 * Defaults to 20 if the poll or data is missing.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @returns {Promise<number>} The Merkle Tree depth.
 */
export async function getMerkleTreeDepth(pollId) {
  if (!pollId) return 20
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules(pollId)

  try {
      const depth = await publicClient.readContract({
          address: eligibilityModule,
          abi: SemaphoreEligibilityModuleABI,
          functionName: 'getMerkleTreeDepth',
          args: [BigInt(pollId)]
      })
      return Number(depth)
  } catch (err) {
      return 20
  }
}

/**
 * Fetches the identity commitments of all registered members in a Semaphore poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @returns {Promise<Array<{identityCommitment: string, transactionHash: string, blockNumber: bigint}>>} List of members.
 */
export async function getGroupMembers(pollId) {
  if (!pollId) return []
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules(pollId)
  
  // Semaphore Event: MemberAdded(uint256 indexed groupId, uint256 identityCommitment, uint256 merkleTreeRoot)
  // groupId is the pollId
  try {
      const logs = await publicClient.getLogs({
        address: eligibilityModule,
        event: parseAbiItem('event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)'),
        args: {
          groupId: BigInt(pollId)
        },
        fromBlock: 'earliest'
      })

      return logs.map(log => {
          const id = log.args?.identityCommitment || log.args?.[2]
          return id ? { 
            identityCommitment: id.toString(),
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber
          } : null
      }).filter(Boolean)
  } catch (e) {
      console.error('getGroupMembers failed:', e)
      return []
  }
}

/**
 * Checks if a user address is whitelisted in a poll's eligibility module.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {string} userAddress - The wallet address to check.
 * @returns {Promise<boolean>} True if whitelisted, false otherwise.
 */
export async function isUserWhitelisted(pollId, userAddress) {
  if (!pollId || !userAddress) return false
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules(pollId)

  return publicClient.readContract({
    address: eligibilityModule,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'isWhitelisted',
    args: [BigInt(pollId), userAddress],
  })
}

/**
 * Checks if a user has already cast a vote in the specified poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {string} userAddress - The wallet address to check.
 * @returns {Promise<boolean>} True if the user has voted, false otherwise.
 */
export async function hasVoted(pollId, userAddress) {
  if (!pollId || !userAddress) return false
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules(pollId)

  try {
    return await publicClient.readContract({
      address: voteStorage,
      abi: IVoteStorageABI,
      functionName: 'hasVoted',
      args: [BigInt(pollId), userAddress],
    })
  } catch (err) {
    console.error('hasVoted failed:', err)
    return false
  }
}

/**
 * Fetches details of a specific vote from storage.
 * Handles both standard (V0) and encrypted (ZK) vote storage.
 * 
 * @param {string|number} voteId - The ID of the vote.
 * @param {string|number} pollId - The ID of the corresponding poll.
 * @returns {Promise<Object|null>} The vote data or null if not found.
 */
export async function getVote(voteId, pollId) {
  if (!voteId) return null
  const publicClient = getPublicClient(config)
  
  try {
    // Determine which ABI to use based on the storage address assigned to the poll
    const [{ voteStorage }, { voteStorage: defaultVoteStorage }] = await Promise.all([
        getModules(pollId),
        getModules()
    ])

    const isStandardV0 = voteStorage.toLowerCase() === defaultVoteStorage.toLowerCase()
    const abi = isStandardV0 ? VoteStorageV0ABI : ZKElGamalVoteVectorABI
    
    const voteData = await publicClient.readContract({
      address: voteStorage,
      abi: abi,
      functionName: 'getVote',
      args: [BigInt(voteId)],
    })

    if (isStandardV0) {
      return {
        voteId: voteData.voteId.toString(),
        pollId: voteData.pollId.toString(),
        optionIdx: voteData.optionIdx.toString(),
        voter: voteData.voter,
      }
    } else {
      return {
        voteId: voteData.voteId.toString(),
        pollId: voteData.pollId.toString(),
        optionIdx: null, // Encrypted!
        voter: voteData.voter,
        encVote: voteData.encVote.map(v => v.toString())
      }
    }
  } catch (err) {
    console.error('getVote failed:', err)
    return null
  }
}
/**
 * Fetches the list of Result NFTs owned by a user.
 * 
 * @param {string} userAddress - The wallet address of the user.
 * @returns {Promise<Array>} List of NFT metadata objects.
 */
export async function getUserNFTs(userAddress) {
  if (!userAddress) return []
  const publicClient = getPublicClient(config)
  
  // Get ResultNFT address (contract stores it)
  const resultNFTAddress = await publicClient.readContract({
    address: votingSystemContract.address,
    abi: votingSystemContract.abi,
    functionName: 's_resultNFT',
  })

  // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
  const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)')

  try {
    const logs = await publicClient.getLogs({
      address: resultNFTAddress,
      event: transferEventAbi,
      args: {
        to: userAddress
      },
      fromBlock: 'earliest'
    })

    const tokenIds = [...new Set(logs.map(log => log.args.tokenId))]

    // Fetch metadata for each token
    const nfts = await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          const tokenURI = await publicClient.readContract({
            address: resultNFTAddress,
            abi: ResultNFTABI,
            functionName: 'tokenURI',
            args: [tokenId]
          })

          // Parse base64 tokenURI
          const jsonPart = tokenURI.replace('data:application/json;base64,', '')
          if (!jsonPart) return { tokenId: tokenId.toString(), name: `NFT #${tokenId}`, description: 'No Metadata' }
          const metadata = JSON.parse(atob(jsonPart))
          
          return {
            tokenId: tokenId.toString(),
            ...metadata
          }
        } catch (e) {
          console.error(`Failed to fetch URI for token ${tokenId}`, e)
          return { tokenId: tokenId.toString(), name: `NFT #${tokenId}`, error: true }
        }
      })
    )

    return nfts
  } catch (err) {
    console.error('getUserNFTs failed:', err)
    return []
  }
}

/**
 * Fetches the total results/votes per option for a specific poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {number} optionCount - The number of options in the poll.
 * @returns {Promise<string[]>} Array of vote counts as strings.
 */
export async function getPollResults(pollId, optionCount) {
  if (!pollId) return []
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules(pollId)

  try {
    const results = await publicClient.readContract({
      address: voteStorage,
      abi: IVoteStorageABI,
      functionName: 'getResults',
      args: [BigInt(pollId), BigInt(optionCount)],
    })
    // Convert BigInts to strings
    return results.map(r => r.toString()) 
  } catch (err) {
    console.error('getPollResults failed:', err)
    return Array(optionCount).fill('0')
  }
}

/**
 * Finds the transaction hash for a user's vote in a specific poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {string} userAddress - The wallet address of the voter.
 * @returns {Promise<string|null>} The transaction hash or null if not found.
 */
export async function getVoteTransaction(pollId, userAddress) {
  if (!pollId || !userAddress) return null
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules(pollId)

  // VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)
  const eventAbi = parseAbiItem('event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)')

  try {
    const logs = await publicClient.getLogs({
      address: voteStorage,
      event: eventAbi,
      args: {
        pollId: BigInt(pollId),
        voter: userAddress
      },
      fromBlock: 'earliest'
    })

    if (logs.length > 0) {
      // Return the most recent vote transaction
      const log = logs[logs.length - 1]
      return log.transactionHash
    }
    return null
  } catch (err) {
    console.error('getVoteTransaction failed:', err)
    return null
  }
}

/**
 * Fetches all vote cast events for a specific poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {number|string} [fromBlock] - Start block.
 * @param {number|string} [toBlock] - End block.
 * @returns {Promise<Array>} List of vote metadata objects.
 */
export async function getPollVotes(pollId, fromBlock, toBlock) {
  if (!pollId) return []
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules(pollId)

  try {
    const logs = await publicClient.getLogs({
      address: voteStorage,
      event: parseAbiItem('event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)'),
      args: {
        pollId: BigInt(pollId),
      },
      fromBlock: fromBlock || 'earliest',
      toBlock: toBlock || 'latest'
    })

    return logs.map(log => ({
      voter: log.args.voter,
      voteId: log.args.voteId.toString(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber
    }))
  } catch (err) {
    return []
  }
}


/**
 * Fetches the inner state of a ZK ElGamal poll from storage.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @returns {Promise<Object|null>} The ZK poll state or null if not a ZK poll.
 */
export async function getZKPollState(pollId) {
  if (!pollId) return null
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules(pollId)

  // Verify this is indeed the ZK Vote Storage
  if (voteStorage.toLowerCase() !== CONTRACT_ADDRESSES.zkElGamalVoteVector.toLowerCase()) {
      return null // Not a ZK poll
  }

  try {
    const [
      initialized,
      voteCount,
      resultsPublished,
      voteVerifier,
      tallyVerifier,
      pollOwner
    ] = await publicClient.readContract({
      address: voteStorage,
      abi: ZKElGamalVoteVectorABI,
      functionName: 'polls', 
      args: [BigInt(pollId)],
    })
    
    return {
        initialized,
        voteCount: voteCount.toString(),
        resultsPublished,
        voteVerifier,
        tallyVerifier,
        pollOwner
    }
  } catch (err) {
    console.error('getZKPollState failed:', err)
    return null
  }
}
