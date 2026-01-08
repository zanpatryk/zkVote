import { getPublicClient } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import PollManagerABI from '@/lib/contracts/abis/PollManager.json'
import SemaphoreEligibilityModuleABI from '@/lib/contracts/abis/SemaphoreEligibilityModule.json'
import ResultNFTABI from '@/lib/contracts/abis/ResultNFT.json'
import IVoteStorageABI from '@/lib/contracts/abis/IVoteStorage.json'
import VoteStorageV0ABI from '@/lib/contracts/abis/VoteStorageV0.json'
import { parseAbiItem } from 'viem'

// Helper to get module addresses
export async function getModules() {
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

export async function getOwnedPolls(address) {
  if (!address) return []
  const publicClient = getPublicClient(config)
  const { pollManager } = await getModules()

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

export async function getWhitelistedPolls(address) {
  if (!address) return []
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules()

  // Query events: Eligible(address indexed user, uint256 indexed pollId)
  // Check SemaphoreEligibilityModuleABI for exact event if needed, but standard is Whitelisted
  const logs = await publicClient.getLogs({
    address: eligibilityModule,
    event: parseAbiItem('event Whitelisted(address indexed user, uint256 indexed pollId)'),
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

export async function getWhitelistedAddresses(pollId, fromBlock, toBlock) {
    if (!pollId) return []
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules()
  
    try {
      // Query events: Whitelisted(address indexed user, uint256 indexed pollId)
      const logs = await publicClient.getLogs({
        address: eligibilityModule,
        event: parseAbiItem('event Whitelisted(address indexed user, uint256 indexed pollId)'),
        args: {
            pollId: BigInt(pollId)
        },
        fromBlock: fromBlock || 'earliest',
        toBlock: toBlock || 'latest'
      })
  
      // Return raw address strings
      // We will handle deduplication in the UI component to support merging pages
      return logs.map(log => log.args.user)
    } catch (err) {
      console.error('getWhitelistedAddresses failed:', err)
      return []
    }
  }

export async function getMerkleTreeDepth(pollId) {
  if (!pollId) return 20
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules()

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

export async function getGroupMembers(pollId) {
  if (!pollId) return []
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules()
  
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
          console.log('MemberAdded Log:', log)
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

export async function isUserWhitelisted(pollId, userAddress) {
  if (!pollId || !userAddress) return false
  const publicClient = getPublicClient(config)
  const { eligibilityModule } = await getModules()

  return publicClient.readContract({
    address: eligibilityModule,
    abi: SemaphoreEligibilityModuleABI,
    functionName: 'isWhitelisted',
    args: [BigInt(pollId), userAddress],
  })
}

export async function hasVoted(pollId, userAddress) {
  if (!pollId || !userAddress) return false
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules()

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

export async function getVote(voteId) {
  if (!voteId) return null
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules()

  try {
    const voteData = await publicClient.readContract({
      address: voteStorage,
      abi: VoteStorageV0ABI,
      functionName: 'getVote',
      args: [BigInt(voteId)],
    })

    return {
      voteId: voteData.voteId.toString(),
      pollId: voteData.pollId.toString(),
      optionIdx: voteData.optionIdx.toString(),
      voter: voteData.voter,
    }
  } catch (err) {
    console.error('getVote failed:', err)
    return null
  }
}
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

export async function getPollResults(pollId, optionCount) {
  if (!pollId) return []
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules()

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

export async function getVoteTransaction(pollId, userAddress) {
  if (!pollId || !userAddress) return null
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules()

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

export async function getPollVotes(pollId, fromBlock, toBlock) {
  if (!pollId) return []
  const publicClient = getPublicClient(config)
  const { voteStorage } = await getModules()

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
    console.error('getPollVotes failed:', err)
    return []
  }
}
