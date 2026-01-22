import {
  writeContract,
  waitForTransactionReceipt,
  getAccount,
} from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { votingSystemContract, MODULE_ADDRESSES } from '@/lib/contracts'
import { pollManagerContract, voteStorageContract } from '@/lib/contracts'
import {
  encodeAbiParameters,
  parseAbiParameters,
  encodeEventTopics,
  decodeEventLog,
} from 'viem'
import { toast } from 'react-hot-toast'
import { toastTransactionError, formatTransactionError } from '@/lib/blockchain/utils/error-handler'
import { getModules } from './read'


/**
 * Creates a new poll in the modular VotingSystemEngine.
 * Encodes poll details (title, options, etc.) as JSON bytes.
 *
 * @param {Object} pollDetails - The poll configuration (title, options, modules).
 * @param {string} pollDetails.title
 * @param {string} pollDetails.description
 * @param {string[]} pollDetails.options
 * @param {number} [pollDetails.merkleTreeDepth] - Used for Semaphore anonymity
 * @param {address} [pollDetails.eligibilityModule] - Optional override
 * @param {address} [pollDetails.voteStorage] - Optional override
 * @param {Object} [pollDetails.voteStorageConfig] - Config data (e.g. ElGamal PK)
 * @returns {Promise<string>} The newly created poll ID.
 */
export async function createPoll(pollDetails) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'poll-creation'
  try {
    toast.loading('Initializing poll creation...', { id: toastId })

    const {
      title,
      description,
      options,
      merkleTreeDepth,
      eligibilityModule,
      voteStorage,
      voteStorageParams // { publicKey: [x, y] }
    } = pollDetails

    // 1. Encode Eligibility Config (Merkle Tree Depth for Semaphore)
    const depth = merkleTreeDepth ? BigInt(merkleTreeDepth) : BigInt(20)
    const eligibilityConfig = encodeAbiParameters(
      parseAbiParameters('uint256'),
      [depth]
    )

    // 2. Encode Vote Storage Config (ElGamal PK + Verifiers for ZKElGamalVoteVector)
    let voteStorageConfig = '0x'
    if (voteStorage === MODULE_ADDRESSES.zkElGamalVoteVector && voteStorageParams?.publicKey) {
      voteStorageConfig = encodeAbiParameters(
        parseAbiParameters('uint256[2], address, address'),
        [
          voteStorageParams.publicKey.map(v => BigInt(v)),
          MODULE_ADDRESSES.elgamalVoteVerifier,
          MODULE_ADDRESSES.elgamalTallyVerifier
        ]
      )
    }

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
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

    toast.loading('Waiting for confirmation...', { id: toastId })

    const receipt = await waitForTransactionReceipt(config, { hash })

    const pollCreatedTopic = encodeEventTopics({
      abi: pollManagerContract.abi,
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
      abi: pollManagerContract.abi,
      eventName: 'PollCreated',
      data: pollCreatedLog.data,
      topics: pollCreatedLog.topics,
    })

    const pollId = decodedEvent.args.pollId.toString()
    toast.success('Poll created!', { id: toastId })

    return pollId
  } catch (error) {
    console.error('createPoll failed:', error)
    toastTransactionError(error, 'Failed to create poll', { id: toastId })
    throw error
  }
}

/**
 * Whitelists a single user for a specific poll.
 *
 * @param {string|number} pollId - The ID of the poll.
 * @param {string} userAddress - The wallet address to whitelist.
 */
export async function whitelistUser(pollId, userAddress) {
  if (!userAddress) throw new Error('No user to whitelist.')

  const toastId = 'whitelist'
  toast.loading('Whitelisting user...', { id: toastId })

  try {
    const { eligibilityModule } = await getModules(pollId)
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

/**
 * Whitelists multiple users for a specific poll in a single transaction.
 *
 * @param {string|number} pollId - The ID of the poll.
 * @param {string[]} users - Array of wallet addresses to whitelist.
 */
export async function whitelistUsers(pollId, users) {
  if (!users || users.length === 0) throw new Error('No users to whitelist.')

  const toastId = 'whitelist'
  toast.loading(`Whitelisting ${users.length} users...`, { id: toastId })

  try {
    const { eligibilityModule } = await getModules(pollId)
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

/**
 * Casts a plaintext vote in a standard (V0) poll.
 *
 * @param {string|number} pollId - The ID of the poll.
 * @param {number|string} optionIdx - The index of the selected option.
 * @returns {Promise<{voteId: string|null, txHash: string}>} The cast vote ID and transaction hash.
 */
export async function castVote(pollId, optionIdx) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'voting'
  toast.loading('Casting vote...', { id: toastId })

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), BigInt(optionIdx)],
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    const receipt = await waitForTransactionReceipt(config, { hash })

    toast.success('Vote submitted!', { id: toastId })

    const voteCastedTopic = encodeEventTopics({
      abi: voteStorageContract.abi,
      eventName: 'VoteCasted',
    })

    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])

    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: voteStorageContract.abi,
        eventName: 'VoteCasted',
        data: voteCastedLog.data,
        topics: voteCastedLog.topics,
      })
      const voteId = decodedEvent.args.voteId.toString()
      return { voteId, txHash: receipt.transactionHash }
    }

    return { voteId: null, txHash: receipt.transactionHash }
  } catch (error) {
    console.error('castVote failed:', error)
    toastTransactionError(error, 'Failed to submit vote', { id: toastId })
    return null
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
      abi: voteStorageContract.abi,
      eventName: 'VoteCasted',
    })

    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])

    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: voteStorageContract.abi,
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
    // 1. Check if it's a known "Already Voted" error
    const errorMessage = formatTransactionError(error)
    
    if (errorMessage.includes('already cast')) {
      toast.error('You have already cast a vote in this poll!', { id: 'vote' })
      return { alreadyVoted: true }
    }

    // 2. Handle other errors gracefully
    console.error('castVoteWithProof failed:', error)
    toastTransactionError(error, 'Failed to submit vote', { id: 'vote' })
    return null
  }
}

/**
 * Starts a poll, allowing users to cast votes.
 * 
 * @param {string|number} pollId - The ID of the poll.
 */
export async function startPoll(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'poll-management'
  toast.loading('Starting poll...', { id: toastId })

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'startPoll',
      args: [BigInt(pollId)],
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    await waitForTransactionReceipt(config, { hash })

    toast.success('Poll started successfully!', { id: toastId })
  } catch (error) {
    console.error('startPoll failed:', error)
    toastTransactionError(error, 'Failed to start poll', { id: toastId })
    throw error
  }
}

/**
 * Ends a poll, transitioning it to the ended state.
 * 
 * @param {string|number} pollId - The ID of the poll.
 */
export async function endPoll(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'poll-management'
  toast.loading('Ending poll...', { id: toastId })

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'endPoll',
      args: [BigInt(pollId)],
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    await waitForTransactionReceipt(config, { hash })

    toast.success('Poll ended successfully!', { id: toastId })
  } catch (error) {
    console.error('endPoll failed:', error)
    toastTransactionError(error, 'Failed to end poll', { id: toastId })
    throw error
  }
}

/**
 * Mints a Result NFT for a specific poll for the caller.
 * 
 * @param {string|number} pollId - The ID of the poll.
 */
export async function mintResultNFT(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'nft'
  toast.loading('Minting Result NFT...', { id: toastId })

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'mintResultNFT',
      args: [BigInt(pollId)],
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    await waitForTransactionReceipt(config, { hash })

    toast.success('NFT minted successfully!', { id: toastId })
  } catch (error) {
    console.error('mintResultNFT failed:', error)
    toastTransactionError(error, 'Failed to mint NFT', { id: toastId })
    throw error
  }
}

/**
 * Registers a user in a Semaphore-based poll by adding their identity commitment.
 *
 * @param {string|number} pollId - The ID of the poll.
 * @param {string} identityCommitment - The Semaphore identity commitment (bigint string).
 */
export async function addMember(pollId, identityCommitment) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'registration'
  toast.loading('Registering identity...', { id: toastId })

  try {
    const { eligibilityModule } = await getModules(pollId)
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'registerVoter',
      args: [BigInt(pollId), BigInt(identityCommitment)],
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    await waitForTransactionReceipt(config, { hash })

    toast.success('Identity registered successfully!', { id: toastId })
    return true
  } catch (error) {
    console.error('registerVoter failed:', error)
    toastTransactionError(error, 'Failed to register identity', { id: toastId })
    return false
  }
}

/**
 * Casts an encrypted ElGamal vote in a ZK-enabled poll.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {string[]} encryptedData - The encrypted vote vector (uint256[64]).
 * @param {Object} proofData - The ZK proof for the encrypted vote.
 * @returns {Promise<{voteId: string|null, txHash: string}>} The cast vote ID and transaction hash.
 */
export async function castEncryptedVote(pollId, encryptedData, proofData) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  const toastId = 'voting'
  toast.loading('Submitting encrypted vote...', { id: toastId })

  try {
    const args = [
      BigInt(pollId),
      encryptedData.map(v => BigInt(v)),
      {
        a: proofData.a.map(v => BigInt(v)),
        b: proofData.b.map(row => row.map(v => BigInt(v))),
        c: proofData.c.map(v => BigInt(v))
      }
    ]

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castEncryptedVote',
      args: args,
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    const receipt = await waitForTransactionReceipt(config, { hash })

    toast.success('Secret ZK Vote submitted!', { id: toastId })

    const voteCastedTopic = encodeEventTopics({
      abi: votingSystemContract.abi, 
      eventName: 'EncryptedVoteCast',
    })

    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])

    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: votingSystemContract.abi,
        eventName: 'VoteCasted',
        data: voteCastedLog.data,
        topics: voteCastedLog.topics,
      })
      const voteId = decodedEvent.args.voteId.toString()
      return { 
        voteId, 
        txHash: receipt.transactionHash
      }
    }

    return { 
      voteId: null, 
      txHash: receipt.transactionHash
    }
  } catch (error) {
    console.error('castEncryptedVote failed:', error)
    toastTransactionError(error, 'Failed to submit encrypted vote', { id: toastId })
    throw error
  }
}

export async function castEncryptedVoteWithProof(pollId, nullifierHash, semaphoreProof, encryptedData, elgamalProof) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Submitting secret+anonymous vote...', { id: 'vote' })

    const args = [
      BigInt(pollId),
      BigInt(nullifierHash),
      semaphoreProof.map(v => BigInt(v)), // uint256[8]
      encryptedData.map(v => BigInt(v)),  // uint256[64]
      {
        a: elgamalProof.a.map(v => BigInt(v)),
        b: elgamalProof.b.map(row => row.map(v => BigInt(v))),
        c: elgamalProof.c.map(v => BigInt(v))
      }
    ]

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castEncryptedVoteWithProof',
      args: args,
    })

    toast.loading('Waiting for confirmation...', { id: 'vote' })
    const receipt = await waitForTransactionReceipt(config, { hash })
    toast.success('Vote submitted successfully!', { id: 'vote' })

    const voteCastedTopic = encodeEventTopics({
       abi: votingSystemContract.abi,
       eventName: 'EncryptedVoteCast'
    })
    const log = receipt.logs.find(l => l.topics[0] === voteCastedTopic[0])
    
    let result = { txHash: receipt.transactionHash, voteId: null }
    if (log) {
       const decoded = decodeEventLog({
          abi: votingSystemContract.abi,
          eventName: 'EncryptedVoteCast',
          data: log.data,
          topics: log.topics
       })
       result.voteId = decoded.args.voteId.toString()
    }
    return result

  } catch (error) {
    console.error('castEncryptedVoteWithProof failed:', error)
    toastTransactionError(error, 'Failed to submit vote', { id: 'vote' })
    throw error
  }
}

// ...

export async function castPlainVote(pollId, optionIdx) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    toast.loading('Submitting vote...', { id: 'vote' })

    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), BigInt(optionIdx)],
    })

    toast.loading('Waiting for confirmation...', { id: 'vote' })
    const receipt = await waitForTransactionReceipt(config, { hash })

    toast.success('Vote submitted successfully!', { id: 'vote' })

    // Find VoteCasted event
    // Note: VotingSystemEngine relies on VoteStorage returning the voteId or emitting event?
    // Engine generic castVote returns voteId.
    // The Receipt won't show return value directly unless we trace.
    // But VoteStorageV0 emits VoteCasted(pollId, voter, voteId).
    // The Engine MIGHT NOT emit it, but storage does.
    // We should look for VoteCasted event logs.

    // I'll manually define the event for decoding since Engine ABI might lack it.
    
    // Actually, VoteStorageV0 emits: event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId);
    // This is standard.
    // If I use the topic for `VoteCasted(uint256,address,uint256)`, I should find it.
    
    // I'll manually define the event for decoding since Engine ABI might lack it.
    const voteCastedAbiItem = {
      type: 'event',
      name: 'VoteCasted',
      inputs: [
        { type: 'uint256', name: 'pollId', indexed: true },
        { type: 'address', name: 'voter', indexed: true },
        { type: 'uint256', name: 'voteId', indexed: false }
      ]
    }

    const topic = encodeEventTopics({
        abi: [voteCastedAbiItem],
        eventName: 'VoteCasted'
    })[0]

    const log = receipt.logs.find(l => l.topics[0] === topic)

    if (log) {
        const decoded = decodeEventLog({
            abi: [voteCastedAbiItem],
            eventName: 'VoteCasted',
            data: log.data,
            topics: log.topics
        })
        return {
            voteId: decoded.args.voteId.toString(),
            txHash: receipt.transactionHash
        }
    }

    return { 
      voteId: null, 
      txHash: receipt.transactionHash 
    }

  } catch (error) {
    console.error('castPlainVote failed:', error)
    toastTransactionError(error, 'Failed to submit vote', { id: 'vote' })
    throw error
  }
}

/**
 * Publishes the final encrypted results and decryption proof.
 * 
 * @param {string|number} pollId - The ID of the poll.
 * @param {string[]} tally - The final tally results (uint256[16]).
 * @param {Object} proofData - The ZK proof for the tally.
 * @returns {Promise<{success: boolean, transactionHash: string}>}
 */
export async function publishEncryptedResults(pollId, tally, proofData) {
  const toastId = 'poll-management'
  toast.loading('Publishing results...', { id: toastId })

  const args = [
    BigInt(pollId),
    tally.map(v => BigInt(v)), 
    {
      a: proofData.a.map(v => BigInt(v)),
      b: proofData.b.map(row => row.map(v => BigInt(v))),
      c: proofData.c.map(v => BigInt(v))
    }
  ]

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'publishEncryptedResults',
      args: args,
    })

    toast.loading('Waiting for confirmation...', { id: toastId })
    const receipt = await waitForTransactionReceipt(config, { hash })

    toast.success('Results Published!', { id: toastId })
    return { success: true, transactionHash: hash }
  } catch (error) {
     console.error('publishEncryptedResults failed:', error)
     toastTransactionError(error, 'Failed to publish results', { id: toastId })
     throw error
  }
}
