import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { parseAbiItem } from 'viem'
import { 
  votingSystemContract, 
  SemaphoreEligibilityModuleABI,
  CONTRACT_ADDRESSES
} from '@/lib/contracts'
import { getModules } from './core'
import { toast } from 'react-hot-toast'
import { toastTransactionError } from '@/lib/blockchain/utils/error-handler'

// --- READS ---

export async function getWhitelistedAddresses(pollId, fromBlock, toBlock) {
  if (!pollId) return { data: [], error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules(pollId)
  
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
    return { data: logs.map(log => log.args.user), error: null }
  } catch (err) {
    console.error('getWhitelistedAddresses failed:', err)
    return { data: [], error: 'Could not fetch whitelisted addresses.' }
  }
}

export async function getMerkleTreeDepth(pollId) {
  if (!pollId) return { data: 0, error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules(pollId)

    // Only call if it's the Semaphore eligibility module
    const isSemaphore = eligibilityModule?.toLowerCase() === CONTRACT_ADDRESSES.semaphoreEligibility?.toLowerCase()
    
    if (!isSemaphore) {
      return { data: 0, error: null }
    }

    const depth = await publicClient.readContract({
      address: eligibilityModule,
      abi: SemaphoreEligibilityModuleABI,
      functionName: 'getMerkleTreeDepth',
      args: [BigInt(pollId)]
    })
    return { data: Number(depth), error: null }
  } catch (err) {
    console.warn('getMerkleTreeDepth failed or not supported:', err.message)
    return { data: 0, error: null }
  }
}

export async function getGroupMembers(pollId) {
  if (!pollId) return { data: [], error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules(pollId)
    
    const logs = await publicClient.getLogs({
      address: eligibilityModule,
      event: parseAbiItem('event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)'),
      args: { groupId: BigInt(pollId) },
      fromBlock: 'earliest'
    })

    const members = logs.map(log => {
      const id = log.args?.identityCommitment || log.args?.[2]
      return id ? { 
        identityCommitment: id.toString(),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber
      } : null
    }).filter(Boolean)
    
    return { data: members, error: null }
  } catch (err) {
    console.error('getGroupMembers failed:', err)
    return { data: [], error: 'Could not fetch group members.' }
  }
}

export async function isUserWhitelisted(pollId, userAddress) {
  if (!pollId || !userAddress) return { data: false, error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules(pollId)

    const isWhitelisted = await publicClient.readContract({
      address: eligibilityModule,
      abi: SemaphoreEligibilityModuleABI,
      functionName: 'isWhitelisted',
      args: [BigInt(pollId), userAddress],
    })
    return { data: isWhitelisted, error: null }
  } catch (err) {
    console.error('isUserWhitelisted failed:', err)
    return { data: false, error: 'Could not check whitelist status.' }
  }
}

export async function isUserRegistered(pollId, userAddress) {
  if (!pollId || !userAddress) return { data: false, error: null }
  
  try {
    const publicClient = getPublicClient(config)
    const { eligibilityModule } = await getModules(pollId)

    // Only SemaphoreEligibilityModule supports isRegistered
    if (eligibilityModule?.toLowerCase() !== CONTRACT_ADDRESSES.semaphoreEligibility?.toLowerCase()) {
      return { data: false, error: null }
    }

    const registered = await publicClient.readContract({
      address: eligibilityModule,
      abi: SemaphoreEligibilityModuleABI,
      functionName: 'isRegistered',
      args: [BigInt(pollId), userAddress],
    })
    return { data: registered, error: null }
  } catch (err) {
    console.warn('isUserRegistered failed or not supported:', err.message)
    return { data: false, error: null }
  }
}

// --- WRITES ---

export async function whitelistUser(pollId, userAddress) {
  if (!userAddress) throw new Error('No user to whitelist.')
  const toastId = 'whitelist'
  toast.loading('Whitelisting user...', { id: toastId })
  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'whitelistUser',
      args: [BigInt(pollId), userAddress],
    })
    await waitForTransactionReceipt(config, { hash })
    toast.success(`User whitelisted successfully!`, { id: toastId })
  } catch (error) {
    console.error('whitelistUser failed:', error)
    toastTransactionError(error, 'Failed to whitelist user', { id: toastId })
    throw error
  }
}

export async function whitelistUsers(pollId, users) {
  if (!users || users.length === 0) throw new Error('No users to whitelist.')
  const toastId = 'whitelist'
  toast.loading(`Whitelisting ${users.length} users...`, { id: toastId })
  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'whitelistUsers',
      args: [BigInt(pollId), users],
    })
    await waitForTransactionReceipt(config, { hash })
    toast.success(`Users whitelisted successfully!`, { id: toastId })
  } catch (error) {
    console.error('whitelistUsers failed:', error)
    toastTransactionError(error, 'Failed to whitelist users', { id: toastId })
    throw error
  }
}

export async function addMember(pollId, identityCommitment) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')
  const toastId = 'registration'
  toast.loading('Registering identity...', { id: toastId })
  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'registerVoter',
      args: [BigInt(pollId), BigInt(identityCommitment)],
    })
    await waitForTransactionReceipt(config, { hash })
    toast.success('Identity registered successfully!', { id: toastId })
    return true
  } catch (error) {
    console.error('registerVoter failed:', error)
    toastTransactionError(error, 'Failed to register identity', { id: toastId })
    return false
  }
}

// --- EVENTS ---

export const getMemberAddedEventSignature = () => 'event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)'

export const parseMemberAddedLog = (log) => ({
  identityCommitment: (log.args.identityCommitment || log.args[2]).toString(),
  transactionHash: log.transactionHash,
  blockNumber: log.blockNumber,
})
