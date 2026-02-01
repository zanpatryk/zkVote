import { writeContract, getAccount } from '@wagmi/core'
import { waitForTransactionResilient } from '@/lib/blockchain/utils/transaction'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { createHttpPublicClient } from '@/lib/wagmi/chains'
import { parseAbiItem } from 'viem'
import { 
  votingSystemContract, 
  SemaphoreEligibilityModuleABI,
  getAddresses
} from '@/lib/contracts'
import { getModules } from './core'
import { getLogsChunked } from '@/lib/blockchain/utils/logs'

// --- READS ---

export async function getWhitelistedAddresses(pollId, fromBlock, toBlock) {
  if (!pollId) return { data: [], error: null }
  
  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const { eligibilityModule } = await getModules(pollId)
    const addresses = getAddresses(chainId)
    
    const deploymentStartBlock = BigInt(addresses.startBlock || 0)
    
    // Resilient block range: use provided fromBlock but don't go before startBlock
    const startRange = fromBlock || deploymentStartBlock
    const effectiveFromBlock = startRange > deploymentStartBlock ? startRange : deploymentStartBlock

    const [logsStandard, logsV0] = await Promise.all([
      getLogsChunked(publicClient, {
        address: eligibilityModule,
        event: parseAbiItem('event Whitelisted(address indexed user, uint256 indexed pollId)'),
        fromBlock: effectiveFromBlock,
        toBlock: toBlock || 'latest'
      }).catch((err) => {
        console.warn('Standard Whitelisted log fetch failed:', err.message)
        return []
      }),
      getLogsChunked(publicClient, {
        address: eligibilityModule,
        event: parseAbiItem('event EligibilityModuleV0__AddressWhitelisted(address indexed user, uint256 indexed pollId)'),
        fromBlock: effectiveFromBlock,
        toBlock: toBlock || 'latest'
      }).catch((err) => {
        console.warn('V0 Whitelisted log fetch failed:', err.message)
        return []
      })
    ])
  
    const allLogs = [...logsStandard, ...logsV0]
    
    // Filter by pollId in JS and extract user address
    const targetPollId = BigInt(pollId)
    const whitelistedAddresses = allLogs
      .filter(log => {
        const logPollId = log.args?.pollId !== undefined ? log.args.pollId : log.args?.[1]
        if (logPollId === undefined) return false
        // Loose string comparison to be extremely safe against types
        return logPollId.toString() === pollId.toString()
      })
      .map(log => log.args?.user || log.args?.[0])
      .filter(Boolean)

    return { data: whitelistedAddresses, error: null }
  } catch (err) {
    console.error('getWhitelistedAddresses failed:', err)
    return { data: [], error: 'Could not fetch whitelisted addresses.' }
  }
}

export async function getMerkleTreeDepth(pollId) {
  if (!pollId) return { data: 0, error: null }
  
  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const { eligibilityModule } = await getModules(pollId)
    const addresses = getAddresses(chainId)
    const isSemaphore = eligibilityModule?.toLowerCase() === addresses.semaphoreEligibility?.toLowerCase()
    
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
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const { eligibilityModule } = await getModules(pollId)
    const addresses = getAddresses(chainId)
    
    const logs = await getLogsChunked(publicClient, {
      address: eligibilityModule,
      event: parseAbiItem('event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)'),
      fromBlock: BigInt(addresses.startBlock || 0)
    })

    const targetGroupId = BigInt(pollId)
    const members = logs
      .filter(log => {
        const logGroupId = log.args?.groupId !== undefined ? log.args.groupId : log.args?.[0]
        return logGroupId !== undefined && BigInt(logGroupId) === targetGroupId
      })
      .map(log => {
        const id = log.args?.identityCommitment !== undefined ? log.args.identityCommitment : log.args?.[2]
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
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const { eligibilityModule } = await getModules(pollId)

    const isWhitelisted = await publicClient.readContract({
      address: eligibilityModule,
      abi: SemaphoreEligibilityModuleABI,
      functionName: 'isWhitelisted',
      args: [BigInt(pollId), userAddress],
    })
    return { data: !!isWhitelisted, error: null }
  } catch (err) {
    console.error('isUserWhitelisted failed:', err)
    return { data: false, error: 'Could not check whitelist status.' }
  }
}

export async function isUserRegistered(pollId, userAddress) {
  if (!pollId || !userAddress) return { data: false, error: null }
  
  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const { eligibilityModule } = await getModules(pollId)
    const addresses = getAddresses(chainId)
    if (eligibilityModule?.toLowerCase() !== addresses.semaphoreEligibility?.toLowerCase()) {
      return { data: false, error: null }
    }

    const registered = await publicClient.readContract({
      address: eligibilityModule,
      abi: SemaphoreEligibilityModuleABI,
      functionName: 'isRegistered',
      args: [BigInt(pollId), userAddress],
    })
    return { data: !!registered, error: null }
  } catch (err) {
    console.warn('isUserRegistered failed or not supported:', err.message)
    return { data: false, error: null }
  }
}

// --- WRITES ---

export async function whitelistUser(pollId, userAddress) {
  if (!userAddress) throw new Error('No user to whitelist.')
  
  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'whitelistUser',
      args: [BigInt(pollId), userAddress],
    })
    const receipt = await waitForTransactionResilient(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) throw new Error('Transaction REVERTED on chain.')
    
    return true
  } catch (error) {
    console.error('whitelistUser failed:', error)
    throw error
  }
}

export async function whitelistUsers(pollId, users) {
  if (!users || users.length === 0) throw new Error('No users to whitelist.')
  
  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'whitelistUsers',
      args: [BigInt(pollId), users],
    })
    const receipt = await waitForTransactionResilient(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) throw new Error('Transaction REVERTED on chain.')
    
    return true
  } catch (error) {
    console.error('whitelistUsers failed:', error)
    throw error
  }
}

export async function addMember(pollId, identityCommitment) {
  const account = getAccount(config)
  if (!account?.address) throw new Error('Wallet not connected')

  try {
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'registerVoter',
      args: [BigInt(pollId), BigInt(identityCommitment)],
    })
    
    const receipt = await waitForTransactionResilient(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) throw new Error('Transaction REVERTED on chain.')
    
    return true
  } catch (error) {
    console.error('registerVoter failed:', error)
    throw error
  }
}

// --- EVENTS ---

export const getMemberAddedEventSignature = () => 'event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)'

export const parseMemberAddedLog = (log) => ({
  identityCommitment: (log.args.identityCommitment || log.args[2]).toString(),
  transactionHash: log.transactionHash,
  blockNumber: log.blockNumber,
})
