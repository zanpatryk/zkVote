import {
  getAccount,
  writeContract,
  waitForTransactionReceipt,
} from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract } from '@/lib/contracts/VotingSystemEngine'
import PollManagerABI from '@/lib/contracts/abis/PollManager.json'
import IVoteStorageABI from '@/lib/contracts/abis/IVoteStorage.json'
import { decodeEventLog, encodeEventTopics, encodeAbiParameters, parseAbiParameters } from 'viem'
import { toast } from 'react-hot-toast'

export async function createPoll(pollDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Creating poll...', { id: 'tx' })

    const { title, description, options, merkleTreeDepth } = pollDetails
    
    // Default to depth 20 if not provided, ensuring valid ZK tree depth
    const depth = merkleTreeDepth ? BigInt(merkleTreeDepth) : BigInt(20)
    
    const eligibilityConfig = encodeAbiParameters(
      parseAbiParameters('uint256'),
      [depth]
    )

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'createPoll',
      args: [title, description || '', options, eligibilityConfig],
    })

    toast.loading('Waiting for confirmation...', { id: 'tx' })

    const receipt = await waitForTransactionReceipt(config, { hash })
    
    const pollCreatedTopic = encodeEventTopics({
      abi: PollManagerABI,
      eventName: 'PollCreated',
    })



    if (receipt.status === 'reverted' || receipt.status === 0) {
        throw new Error('Transaction REVERTED on chain.')
    }

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
  if (!users || users.length === 0) throw new Error('No users to whitelist.')

  toast.loading(`Whitelisting ${users.length} users...`, { id: 'whitelist' })

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'whitelistUsers',
      args: [BigInt(pollId), users],
    })
    await waitForTransactionReceipt(config, { hash })

    toast.success(`Users whitelisted successfully!`, { id: 'whitelist' })
  } catch (error) {
    console.error('whitelistUsers failed:', error)
    toast.error(error.shortMessage || 'Failed to whitelist users', { id: 'whitelist' })
    throw error
  }
}

export async function castVote(pollId, voteDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Sending vote...', { id: 'vote' })

    const { optionIndex } = voteDetails

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), BigInt(optionIndex)],
    })

    toast.loading('Waiting for confirmation...', { id: 'vote' })
    const receipt = await waitForTransactionReceipt(config, { hash })

    toast.success('Vote submitted!', { id: 'vote' })

    const voteCastedTopic = encodeEventTopics({
      abi: IVoteStorageABI,
      eventName: 'VoteCasted',
    })

    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])

    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: IVoteStorageABI,
        eventName: 'VoteCasted',
        data: voteCastedLog.data,
        topics: voteCastedLog.topics,
      })
      const voteId = decodedEvent.args.voteId.toString()
      toast.success('Vote submitted!', { id: 'vote' })
      return { voteId, txHash: receipt.transactionHash }
    }

    toast.success('Vote submitted!', { id: 'vote' })
    return { voteId: null, txHash: receipt.transactionHash }
  } catch (error) {
    console.error('castVote failed:', error)
    toast.error(error.shortMessage || 'Failed to submit vote', { id: 'vote' })
    throw error
  }
}

export async function castVoteWithProof(pollId, voteDetails, proofData) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Verifying proof & Casting vote...', { id: 'vote' })

    const { optionIndex } = voteDetails
    const { nullifier, points: proof } = proofData

    // proof is likely an array of strings/bigints from Semaphore
    // Contract expects uint256[8]
    const formattedProof = proof.map(p => BigInt(p))

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVoteWithProof',
      args: [
          BigInt(pollId), 
          BigInt(optionIndex), 
          BigInt(nullifier), 
          formattedProof
      ],
    })

    toast.loading('Waiting for confirmation...', { id: 'vote' })
    const receipt = await waitForTransactionReceipt(config, { hash })

    toast.success('Secure ZK Vote submitted!', { id: 'vote' })

    const voteCastedTopic = encodeEventTopics({
      abi: IVoteStorageABI,
      eventName: 'VoteCasted',
    })

    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])

    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: IVoteStorageABI,
        eventName: 'VoteCasted',
        data: voteCastedLog.data,
        topics: voteCastedLog.topics,
      })
      const voteId = decodedEvent.args.voteId.toString()
      return { 
        voteId, 
        txHash: receipt.transactionHash,
        nullifier,
        proof: formattedProof.map(p => p.toString()) // Return as strings for easier transport
      }
    }

    return { 
      voteId: null, 
      txHash: receipt.transactionHash,
      nullifier,
      proof: formattedProof.map(p => p.toString())
    }
  } catch (error) {
    console.error('castVoteWithProof failed:', error)
    toast.error(error.shortMessage || 'Failed to submit secure vote', { id: 'vote' })
    throw error
  }
}

export async function startPoll(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Starting poll...', { id: 'status' })

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'startPoll',
      args: [BigInt(pollId)],
    })

    toast.loading('Waiting for confirmation...', { id: 'status' })
    await waitForTransactionReceipt(config, { hash })

    toast.success('Poll started successfully!', { id: 'status' })
  } catch (error) {
    console.error('startPoll failed:', error)
    toast.error(error.shortMessage || 'Failed to start poll', { id: 'status' })
    throw error
  }
}

export async function endPoll(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Ending poll...', { id: 'status' })

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'endPoll',
      args: [BigInt(pollId)],
    })

    toast.loading('Waiting for confirmation...', { id: 'status' })
    await waitForTransactionReceipt(config, { hash })

    toast.success('Poll ended successfully!', { id: 'status' })
  } catch (error) {
    console.error('endPoll failed:', error)
    toast.error(error.shortMessage || 'Failed to end poll', { id: 'status' })
    throw error
  }
}

export async function mintResultNFT(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Minting Result NFT...', { id: 'nft' })

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'mintResultNFT',
      args: [BigInt(pollId)],
    })

    toast.loading('Waiting for confirmation...', { id: 'nft' })
    await waitForTransactionReceipt(config, { hash })

    toast.success('NFT minted successfully!', { id: 'nft' })
  } catch (error) {
    console.error('mintResultNFT failed:', error)
    toast.error(error.shortMessage || 'Failed to mint NFT', { id: 'nft' })
    throw error
  }
}

export async function registerVoter(pollId, identityCommitment) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Registering identity...', { id: 'register' })

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'registerVoter',
      args: [BigInt(pollId), BigInt(identityCommitment)],
    })

    toast.loading('Waiting for confirmation...', { id: 'register' })
    await waitForTransactionReceipt(config, { hash })

    toast.success('Identity registered successfully!', { id: 'register' })
  } catch (error) {
    console.error('registerVoter failed:', error)
    toast.error(error.shortMessage || 'Failed to register identity', { id: 'register' })
    throw error
  }
}
