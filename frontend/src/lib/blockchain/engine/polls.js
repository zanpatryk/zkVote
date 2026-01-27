import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { parseAbiItem, encodeAbiParameters, parseAbiParameters, encodeEventTopics, decodeEventLog } from 'viem'
import { 
  votingSystemContract, 
  PollManagerABI, 
  pollManagerContract
} from '@/lib/contracts'
import { getAddresses, CONTRACT_ADDRESSES } from '@/lib/contracts'
import { getModules } from './core'

// --- READS ---

export async function getPollById(pollId) {
  if (!pollId) return { data: null, error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { pollManager } = await getModules(pollId)

    const [id, owner, title, description, options, state] = await publicClient.readContract({
      address: pollManager,
      abi: PollManagerABI,
      functionName: 'getPoll',
      args: [BigInt(pollId)],
    })

    return {
      data: {
        pollId: id.toString(),
        title,
        description,
        creator: owner,
        options: [...options],
        state: state
      },
      error: null
    }
  } catch (err) {
    console.error('getPollById failed:', err)
    return { data: null, error: 'Could not fetch poll data. Please check your network.' }
  }
}

export async function getOwnedPolls(address) {
  if (!address) return { data: [], error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { pollManager } = await getModules()

    const logs = await publicClient.getLogs({
      address: pollManager,
      event: parseAbiItem('event PollCreated(uint256 indexed pollId, address indexed creator)'),
      args: { creator: address },
      fromBlock: 'earliest'
    })

    const pollIds = logs.map(log => log.args.pollId)
    const pollResults = await Promise.all(pollIds.map(id => getPollById(id)))
    const polls = pollResults.map(r => r.data).filter(Boolean)
    return { data: polls, error: null }
  } catch (err) {
    console.error('getOwnedPolls failed:', err)
    return { data: [], error: 'Could not fetch owned polls. Please check your network.' }
  }
}

export async function getWhitelistedPolls(address) {
  if (!address) return { data: [], error: null }
  
  try {
    const publicClient = getPublicClient(config)
    
    const chainId = publicClient.chain.id
    const addresses = getAddresses(chainId)
    
    const modulesToQuery = [
      addresses.eligibilityV0,
      addresses.semaphoreEligibility
    ].filter(Boolean)

    const allLogs = await Promise.all(
      modulesToQuery.flatMap(moduleAddr => [
        publicClient.getLogs({
          address: moduleAddr,
          event: parseAbiItem('event Whitelisted(address indexed user, uint256 indexed pollId)'),
          args: { user: address },
          fromBlock: 'earliest'
        }),
        publicClient.getLogs({
          address: moduleAddr,
          event: parseAbiItem('event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)'),
          args: { user: address },
          fromBlock: 'earliest'
        })
      ])
    )

    const logs = allLogs.flat()
    const pollIds = [...new Set(logs.map(log => log.args.pollId))]
    const pollResults = await Promise.all(pollIds.map(id => getPollById(id)))
    const polls = pollResults.map(r => r.data).filter(Boolean)
    return { data: polls, error: null }
  } catch (err) {
    console.error('getWhitelistedPolls failed:', err)
    return { data: [], error: 'Could not fetch whitelisted polls. Please check your network.' }
  }
}

// --- WRITES ---

export async function createPoll(pollDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const {
      title,
      description,
      options,
      merkleTreeDepth,
      eligibilityModule,
      voteStorage,
      voteStorageParams
    } = pollDetails

    const { chainId } = getAccount(config)
    const activeAddresses = getAddresses(chainId)

    const depth = merkleTreeDepth ? BigInt(merkleTreeDepth) : BigInt(20)
    const eligibilityConfig = encodeAbiParameters(parseAbiParameters('uint256'), [depth])

    let voteStorageConfig = '0x'
    if (voteStorage === activeAddresses.zkElGamalVoteVector && voteStorageParams?.publicKey) {
      voteStorageConfig = encodeAbiParameters(
        parseAbiParameters('uint256[2], address, address'),
        [
          voteStorageParams.publicKey.map(v => BigInt(v)),
          activeAddresses.elgamalVoteVerifier,
          activeAddresses.elgamalTallyVerifier
        ]
      )
    }

    const hash = await writeContract(config, {
      address: activeAddresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'createPoll',
      args: [
        title,
        description || '',
        options,
        voteStorageConfig,
        eligibilityConfig,
        eligibilityModule || '0x0000000000000000000000000000000000000000',
        voteStorage || '0x0000000000000000000000000000000000000000'
      ],
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) throw new Error('Transaction REVERTED on chain.')

    const pollCreatedTopic = encodeEventTopics({ abi: pollManagerContract.abi, eventName: 'PollCreated' })
    const pollCreatedLog = receipt.logs.find(log => log.topics[0] === pollCreatedTopic[0])

    if (!pollCreatedLog) throw new Error('PollCreated event not found in logs.')

    const decodedEvent = decodeEventLog({
      abi: pollManagerContract.abi,
      eventName: 'PollCreated',
      data: pollCreatedLog.data,
      topics: pollCreatedLog.topics,
    })

    return decodedEvent.args.pollId.toString()
  } catch (error) {
    console.error('createPoll failed:', error)
    throw error
  }
}

export async function startPoll(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const { chainId } = getAccount(config)
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'startPoll',
      args: [BigInt(pollId)],
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) throw new Error('Transaction REVERTED on chain.')
    
    return true
  } catch (error) {
    console.error('startPoll failed:', error)
    throw error
  }
}

export async function endPoll(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const { chainId } = getAccount(config)
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'endPoll',
      args: [BigInt(pollId)],
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) throw new Error('Transaction REVERTED on chain.')
    
    return true
  } catch (error) {
    console.error('endPoll failed:', error)
    throw error
  }
}
