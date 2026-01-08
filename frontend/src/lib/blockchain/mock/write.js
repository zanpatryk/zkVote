import {
  getAccount,
  writeContract,
  waitForTransactionReceipt,
} from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemMockContract } from '@/lib/contracts/VotingSystemMock'
import { decodeEventLog, encodeEventTopics, stringToHex } from 'viem'
import { toast } from 'react-hot-toast'
import { toastTransactionError } from '../utils/error-handler'

export async function createPoll(pollDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const pollData = {
      ...pollDetails,
      creator: address,
    }

    toast.loading('Sending transaction...', { id: 'tx' })

    const hash = await writeContract(config, {
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'createPoll',
      args: [stringToHex(JSON.stringify(pollData))],
    })

    toast.loading('Waiting for confirmation...', { id: 'tx' })

    const receipt = await waitForTransactionReceipt(config, { hash })

    const pollCreatedTopic = encodeEventTopics({
      abi: votingSystemMockContract.abi,
      eventName: 'PollCreated',
    })
    // Find the PollCreated event in the transaction logs
    const pollCreatedLog = receipt.logs.find(log => log.topics[0] === pollCreatedTopic[0])

    if (!pollCreatedLog) {
      throw new Error('PollCreated event not found in transaction logs.')
    }

    const decodedEvent = decodeEventLog({
      abi: votingSystemMockContract.abi,
      eventName: 'PollCreated',
      data: pollCreatedLog.data,
      topics: pollCreatedLog.topics,
    })

    const pollId = decodedEvent.args.pollId.toString()
    toast.success('Poll created!', { id: 'tx' })

    return pollId
  } catch (error) {
    console.error('createPoll failed:', error)
    toastTransactionError(error, 'Failed to create poll', { id: 'tx' })
    throw error
  }
}

export async function whitelistUser(pollId, user) {
  if (!user) {
    throw new Error('No user to whitelist.')
  }

  toast.loading(`Whitelisting user...`, { id: 'whitelist' })

  try {
    const hash = await writeContract(config, {
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'whitelistUser',
      args: [pollId, user],
    })
    await waitForTransactionReceipt(config, { hash })

    toast.success(`User whitelisted successfully!`, {
      id: 'whitelist',
    })
  } catch (error) {
    console.error('whitelistUser failed:', error)
    toastTransactionError(error, 'Failed to whitelist user', { id: 'whitelist' })
    throw error
  }
}

export async function whitelistUsers(pollId, users) {
  if (!users || users.length === 0) {
    throw new Error('No users to whitelist.')
  }

  toast.loading(`Whitelisting ${users.length} users...`, { id: 'whitelist' })

  try {
    const hash = await writeContract(config, {
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'whitelistUsers',
      args: [pollId, users],
    })
    await waitForTransactionReceipt(config, { hash })

    toast.success(`${users.length} user(s) whitelisted successfully!`, {
      id: 'whitelist',
    })
  } catch (error) {
    console.error('whitelistUsers failed:', error)
    toastTransactionError(error, 'Failed to whitelist users', { id: 'whitelist' })
    throw error
  }
}

export async function castVote(pollId, voteDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const voteData = {
    ...voteDetails,
    voter: address,
  }

  try {
    toast.loading('Sending vote...', { id: 'vote' })

    const hash = await writeContract(config, {
      address: votingSystemMockContract.address,
      abi: votingSystemMockContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), stringToHex(JSON.stringify(voteData))],
    })

    toast.loading('Waiting for confirmation...', { id: 'vote' })
    const receipt = await waitForTransactionReceipt(config, { hash })

    const voteCastTopic = encodeEventTopics({
      abi: votingSystemMockContract.abi,
      eventName: 'VoteCast',
    })

    const voteCastLog = receipt.logs.find(log => log.topics[0] === voteCastTopic[0])

    if (!voteCastLog) {
      throw new Error('VoteCast event not found in transaction logs.')
    }

    const decodedEvent = decodeEventLog({
      abi: votingSystemMockContract.abi,
      eventName: 'VoteCast',
      data: voteCastLog.data,
      topics: voteCastLog.topics,
    })

    const voteId = decodedEvent.args.voteId.toString()

    toast.success('Vote submitted!', { id: 'vote' })

    return voteId
  } catch (error) {
    console.error('castVote failed:', error)
    toast.error(error.shortMessage || 'Failed to submit vote', { id: 'vote' })
    throw error
  }
}