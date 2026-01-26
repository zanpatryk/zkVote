import { getPublicClient, writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { parseAbiItem, encodeEventTopics, decodeEventLog } from 'viem'
import { 
  votingSystemContract, 
  IVoteStorageABI, 
  VoteStorageV0ABI, 
  ZKElGamalVoteVectorABI,
  CONTRACT_ADDRESSES,
  voteStorageContract
} from '@/lib/contracts'
import { getModules } from './core'

// --- READS ---

export async function hasVoted(pollId, userAddress) {
  if (!pollId || !userAddress) return { data: false, error: null }
  try {
    const publicClient = getPublicClient(config)
    const { voteStorage } = await getModules(pollId)
    const voted = await publicClient.readContract({
      address: voteStorage,
      abi: IVoteStorageABI,
      functionName: 'hasVoted',
      args: [BigInt(pollId), userAddress],
    })
    return { data: voted, error: null }
  } catch (err) {
    console.error('hasVoted failed:', err)
    return { data: false, error: 'Could not check vote status.' }
  }
}

export async function getVote(voteId, pollId) {
  if (!voteId) return { data: null, error: null }
  try {
    const publicClient = getPublicClient(config)
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
        data: {
          voteId: voteData.voteId.toString(),
          pollId: voteData.pollId.toString(),
          optionIdx: voteData.optionIdx.toString(),
          voter: voteData.voter,
        },
        error: null
      }
    } else {
      return {
        data: {
          voteId: voteData.voteId.toString(),
          pollId: voteData.pollId.toString(),
          optionIdx: null,
          voter: voteData.voter,
          encVote: voteData.encVote.map(v => v.toString())
        },
        error: null
      }
    }
  } catch (err) {
    console.error('getVote failed:', err)
    return { data: null, error: 'Could not fetch vote data.' }
  }
}

export async function getPollResults(pollId, optionCount) {
  if (!pollId) return { data: [], error: null }
  try {
    const publicClient = getPublicClient(config)
    const { voteStorage } = await getModules(pollId)
    const results = await publicClient.readContract({
      address: voteStorage,
      abi: IVoteStorageABI,
      functionName: 'getResults',
      args: [BigInt(pollId), BigInt(optionCount)],
    })
    return { data: results.map(r => r.toString()), error: null }
  } catch (err) {
    console.error('getPollResults failed:', err)
    return { data: Array(optionCount).fill('0'), error: 'Could not fetch poll results.' }
  }
}

export async function getVoteTransaction(pollId, userAddress) {
  if (!pollId || !userAddress) return { data: null, error: null }
  try {
    const publicClient = getPublicClient(config)
    const { voteStorage } = await getModules(pollId)
    const eventAbi = parseAbiItem('event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)')
    const logs = await publicClient.getLogs({
      address: voteStorage,
      event: eventAbi,
      args: { pollId: BigInt(pollId), voter: userAddress },
      fromBlock: 'earliest'
    })
    if (logs.length > 0) {
      const log = logs[logs.length - 1]
      return { data: log.transactionHash, error: null }
    }
    return { data: null, error: null }
  } catch (err) {
    console.error('getVoteTransaction failed:', err)
    return { data: null, error: 'Could not fetch vote transaction.' }
  }
}

export async function getPollVotes(pollId, fromBlock, toBlock) {
  if (!pollId) return { data: [], error: null }
  try {
    const publicClient = getPublicClient(config)
    const { voteStorage } = await getModules(pollId)
    const logs = await publicClient.getLogs({
      address: voteStorage,
      event: parseAbiItem('event VoteCasted(uint256 indexed pollId, address indexed voter, uint256 voteId)'),
      args: { pollId: BigInt(pollId) },
      fromBlock: fromBlock || 'earliest',
      toBlock: toBlock || 'latest'
    })
    const votes = logs.map(log => ({
      voter: log.args.voter,
      voteId: log.args.voteId.toString(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber
    }))
    return { data: votes, error: null }
  } catch (err) {
    console.error('getPollVotes failed:', err)
    return { data: [], error: 'Could not fetch poll votes.' }
  }
}

export async function getZKPollState(pollId) {
  if (!pollId) return { data: null, error: null }
  try {
    const publicClient = getPublicClient(config)
    const { voteStorage } = await getModules(pollId)
    if (voteStorage.toLowerCase() !== CONTRACT_ADDRESSES.zkElGamalVoteVector.toLowerCase()) return { data: null, error: null }
    const [initialized, voteCount, resultsPublished, voteVerifier, tallyVerifier, pollOwner] = await publicClient.readContract({
      address: voteStorage,
      abi: ZKElGamalVoteVectorABI,
      functionName: 'polls', 
      args: [BigInt(pollId)],
    })
    return {
      data: { initialized, voteCount: voteCount.toString(), resultsPublished, voteVerifier, tallyVerifier, pollOwner },
      error: null
    }
  } catch (err) {
    console.error('getZKPollState failed:', err)
    return { data: null, error: 'Could not fetch ZK poll state.' }
  }
}

export async function getPollPublicKey(pollId) {
  if (!pollId) return { data: null, error: null }
  try {
    const publicClient = getPublicClient(config)
    const { voteStorage } = await getModules(pollId)
    
    // Quick check if it's likely a ZK poll (or let the call fail gracefully)
    if (voteStorage === '0x0000000000000000000000000000000000000000') return { data: null, error: null }
    
    // Attempt to read getPollPublicKey. If it's not a ZK poll, this function won't exist or revert.
    const pollPk = await publicClient.readContract({
      address: voteStorage,
      abi: ZKElGamalVoteVectorABI,
      functionName: 'getPollPublicKey',
      args: [BigInt(pollId)],
    })
    
    return { data: pollPk, error: null }
  } catch (err) {
    // Expected behavior if not a ZK poll or call fails
    return { data: null, error: null } 
  }
}

// --- WRITES ---

export async function castVote(pollId, optionIdx) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), BigInt(optionIdx)],
    })
    const receipt = await waitForTransactionReceipt(config, { hash })
    
    // Check for revert status explicitly if needed, though writeContract usually throws on simulation fail
    if (receipt.status === 'reverted') throw new Error('Transaction reverted')

    const voteCastedTopic = encodeEventTopics({ abi: voteStorageContract.abi, eventName: 'VoteCasted' })
    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])
    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: voteStorageContract.abi,
        eventName: 'VoteCasted',
        data: voteCastedLog.data,
        topics: voteCastedLog.topics,
      })
      return { voteId: decodedEvent.args.voteId.toString(), txHash: receipt.transactionHash }
    }
    return { voteId: null, txHash: receipt.transactionHash }
  } catch (error) {
    console.error('castVote failed:', error)
    throw error // Let the hook handle the error toast
  }
}

export async function castVoteWithProof(pollId, voteDetails, proofData) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')
  try {
    const { optionIndex } = voteDetails
    const { nullifier, points: proof } = proofData
    const formattedProof = proof.map(p => BigInt(p))
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVoteWithProof',
      args: [BigInt(pollId), BigInt(optionIndex), BigInt(nullifier), formattedProof],
    })
    const receipt = await waitForTransactionReceipt(config, { hash })
    
    if (receipt.status === 'reverted') throw new Error('Transaction reverted')

    const voteCastedTopic = encodeEventTopics({ abi: voteStorageContract.abi, eventName: 'VoteCasted' })
    const voteCastedLog = receipt.logs.find(log => log.topics[0] === voteCastedTopic[0])
    if (voteCastedLog) {
       const decodedEvent = decodeEventLog({
        abi: voteStorageContract.abi,
        eventName: 'VoteCasted',
        data: voteCastedLog.data,
        topics: voteCastedLog.topics,
      })
      return { voteId: decodedEvent.args.voteId.toString(), txHash: receipt.transactionHash, nullifier, proof: formattedProof.map(p => p.toString()) }
    }
    return { voteId: null, txHash: receipt.transactionHash, nullifier, proof: formattedProof.map(p => p.toString()) }
  } catch (error) {
    console.error('castVoteWithProof failed:', error)
    throw error // Rely on hook
  }
}

export async function castEncryptedVote(pollId, encryptedData, proofData) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

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

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted') throw new Error('Transaction reverted')

    const voteCastedTopic = encodeEventTopics({ abi: votingSystemContract.abi, eventName: 'EncryptedVoteCast' })
    const log = receipt.logs.find(l => l.topics[0] === voteCastedTopic[0])

    if (log) {
       const decoded = decodeEventLog({
        abi: votingSystemContract.abi,
        eventName: 'VoteCasted', // Note: original used VoteCasted for decoding
        data: log.data,
        topics: log.topics,
      })
      return { voteId: decoded.args.voteId.toString(), txHash: receipt.transactionHash }
    }
    return { voteId: null, txHash: receipt.transactionHash }
  } catch (error) {
    console.error('castEncryptedVote failed:', error)
    throw error
  }
}

export async function castEncryptedVoteWithProof(pollId, nullifierHash, semaphoreProof, encryptedData, elgamalProof) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const args = [
      BigInt(pollId), BigInt(nullifierHash),
      semaphoreProof.map(v => BigInt(v)),
      encryptedData.map(v => BigInt(v)),
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

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted') throw new Error('Transaction reverted')

    const voteCastedTopic = encodeEventTopics({ abi: votingSystemContract.abi, eventName: 'EncryptedVoteCast' })
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
    throw error // Rely on hook
  }
}

export async function castPlainVote(pollId, optionIdx) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const hash = await writeContract(config, {
      address: votingSystemContract.address,
      abi: votingSystemContract.abi,
      functionName: 'castVote',
      args: [BigInt(pollId), BigInt(optionIdx)],
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted') throw new Error('Transaction reverted')

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
    throw error
  }
}

export async function publishEncryptedResults(pollId, tally, proofData) {
  const args = [
    BigInt(pollId),
    tally.map(v => BigInt(v)), 
    { a: proofData.a.map(v => BigInt(v)), b: proofData.b.map(row => row.map(v => BigInt(v))), c: proofData.c.map(v => BigInt(v)) }
  ]
  try {
    const hash = await writeContract(config, { address: votingSystemContract.address, abi: votingSystemContract.abi, functionName: 'publishEncryptedResults', args: args })
    await waitForTransactionReceipt(config, { hash })
    return { success: true, transactionHash: hash }
  } catch (error) {
     console.error('publishEncryptedResults failed:', error)
     throw error
  }
}
