import {
  getAccount,
  writeContract,
  waitForTransactionReceipt,
} from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import PollManagerABI from '@/lib/contracts/abis/PollManager.json'
import { decodeEventLog, encodeEventTopics } from 'viem'
import { toast } from 'react-hot-toast'

export async function createPoll(pollDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Creating poll...', { id: 'tx' })

    const { title, description, options } = pollDetails

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'createPoll',
      args: [title, description || '', options, address],
    })

    toast.loading('Waiting for confirmation...', { id: 'tx' })

    const receipt = await waitForTransactionReceipt(config, { hash })

    // The event PollCreated is emitted by PollManager, not VotingSystemEngine directly.
    // We need to find the PollManager address to decode the log correctly, 
    // OR just look for the event signature in the logs.
    
    // PollCreated(uint256 indexed pollId)
    const pollCreatedTopic = encodeEventTopics({
      abi: PollManagerABI,
      eventName: 'PollCreated',
    })

    const pollCreatedLog = receipt.logs.find(log => log.topics[0] === pollCreatedTopic[0])

    if (!pollCreatedLog) {
      throw new Error('PollCreated event not found in transaction logs.')
    }

    const decodedEvent = decodeEventLog({
      abi: PollManagerABI,
      eventName: 'PollCreated',
      data: pollCreatedLog.data,
      topics: pollCreatedLog.topics,
    })

    const pollId = decodedEvent.args.pollId.toString()
    toast.success('Poll created!', { id: 'tx' })

    return pollId
  } catch (error) {
    console.error('createPoll failed:', error)
    toast.error(error.shortMessage || 'Failed to create poll', { id: 'tx' })
    throw error
  }
}

export async function whitelistUser(pollId, user) {
  if (!user) throw new Error('No user to whitelist.')

  toast.loading(`Whitelisting user...`, { id: 'whitelist' })

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'whitelistUser',
      args: [BigInt(pollId), user],
    })
    await waitForTransactionReceipt(config, { hash })

    toast.success(`User whitelisted successfully!`, { id: 'whitelist' })
  } catch (error) {
    console.error('whitelistUser failed:', error)
    toast.error(error.shortMessage || 'Failed to whitelist user', { id: 'whitelist' })
    throw error
  }
}

export async function whitelistUsers(pollId, users) {
    // VotingSystemEngine does NOT have whitelistUsers (batch) function.
    // We must loop or add batch functionality to Engine.
    // For now, we'll loop (inefficient) or throw error.
    // Or we can implement a multicall on frontend?
    
    // Let's warn for now.
    throw new Error('Batch whitelisting not supported by VotingSystemEngine V0 yet.')
}

export async function castVote(pollId, voteDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Sending vote...', { id: 'vote' })

    // voteDetails should contain optionIndex
    const { optionIndex } = voteDetails

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), BigInt(optionIndex)],
    })

    toast.loading('Waiting for confirmation...', { id: 'vote' })
    const receipt = await waitForTransactionReceipt(config, { hash })

    // VoteStorage emits VoteCasted(pollId)
    // It does NOT return a voteId.
    
    toast.success('Vote submitted!', { id: 'vote' })

    return null // No voteId available
  } catch (error) {
    console.error('castVote failed:', error)
    toast.error(error.shortMessage || 'Failed to submit vote', { id: 'vote' })
    throw error
  }
}
