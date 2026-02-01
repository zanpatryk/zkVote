import { getPublicClient } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { getAddresses, votingSystemContract } from '@/lib/contracts'
import EntryPointABI from '@/lib/contracts/abis/EntryPoint.json'
import { encodeFunctionData, decodeEventLog } from 'viem'
import { waitForTransactionResilient } from '@/lib/blockchain/utils/transaction'

// Generic SimpleAccount-style execute ABI (not tied to test contracts)
const ACCOUNT_EXECUTE_ABI = [
  {
    type: 'function',
    name: 'execute',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [
      { name: 'success', type: 'bool', internalType: 'bool' },
      { name: 'result', type: 'bytes', internalType: 'bytes' },
    ],
  },
]

/**
 * Helper to convert a bigint into a 0x-prefixed, 32-byte hex string
 * suitable for bytes32 ABI parameters.
 */
function toBytes32Hex(value) {
  const hex = BigInt(value).toString(16)
  return `0x${hex.padStart(64, '0')}`
}

/**
 * Packs verificationGas and callGas into a bytes32 (as hex string),
 * matching the Solidity helper used in the Foundry PaymasterIntegration test.
 */
export function packAccountGasLimits(verificationGas, callGas) {
  const v = BigInt(verificationGas)
  const c = BigInt(callGas)
  const packed = (v << 128n) | c
  return toBytes32Hex(packed)
}

/**
 * Packs maxPriorityFeePerGas and maxFeePerGas into a bytes32 (as hex string),
 * matching the Solidity helper used in the Foundry PaymasterIntegration test.
 */
export function packGasFees(maxPriorityFeePerGas, maxFeePerGas) {
  const p = BigInt(maxPriorityFeePerGas)
  const f = BigInt(maxFeePerGas)
  const packed = (p << 128n) | f
  return toBytes32Hex(packed)
}

/**
 * Encodes paymasterAndData in the same layout as:
 * abi.encodePacked(address(paymaster), uint128 verificationGasLimit, uint128 postOpGasLimit, uint256 pollId)
 *
 * EntryPoint expects the first 20 bytes to be the paymaster address,
 * and PollSponsorPaymaster expects pollId to be located at bytes [52:84].
 */
export function encodePaymasterAndData({ paymaster, verificationGasLimit, postOpGasLimit, pollId }) {
  const paymasterHex = paymaster.toLowerCase().replace(/^0x/, '')
  if (paymasterHex.length !== 40) {
    throw new Error('Invalid paymaster address for encodePaymasterAndData')
  }

  const toFixedHex = (value, bytes) => {
    const hex = BigInt(value).toString(16)
    const padded = hex.padStart(bytes * 2, '0')
    if (padded.length > bytes * 2) {
      throw new Error('Value too large for fixed hex encoding')
    }
    return padded
  }

  const verificationHex = toFixedHex(verificationGasLimit, 16) // uint128 = 16 bytes
  const postOpHex = toFixedHex(postOpGasLimit, 16) // uint128 = 16 bytes
  const pollIdHex = toFixedHex(pollId, 32) // uint256 = 32 bytes

  return `0x${paymasterHex}${verificationHex}${postOpHex}${pollIdHex}`
}

/**
 * Builds the inner and outer calldata for a sponsored plain vote executed
 * via a SimpleAccount-style account abstraction wallet.
 *
 * It calls VotingSystemEngine.castSponsoredVote(pollId, optionIdx, voterAddress)
 * from the smart account, so eligibility and accounting remain EOA-based.
 */
export function buildSponsoredVoteCalldata({
  vseAddress,
  simpleAccountAddress,
  pollId,
  optionIdx,
  voterAddress,
}) {
  const innerCall = encodeFunctionData({
    abi: votingSystemContract.abi,
    functionName: 'castSponsoredVote',
    args: [BigInt(pollId), BigInt(optionIdx), voterAddress],
  })

  const execCalldata = encodeFunctionData({
    abi: ACCOUNT_EXECUTE_ABI,
    functionName: 'execute',
    args: [vseAddress, 0n, innerCall],
  })

  return execCalldata
}

/**
 * Builds a PackedUserOperation object (without signature) for a sponsored
 * vote via PollSponsorPaymaster. This mirrors the structure used in
 * PaymasterIntegration.t.sol.
 *
 * NOTE: The caller is responsible for computing userOpHash via
 * EntryPoint.getUserOpHash(userOp) and attaching a compatible signature
 * for the specific account implementation being used.
 */
export async function buildSponsoredVoteUserOp({
  pollId,
  optionIdx,
  simpleAccountAddress,
  voterAddress,
  overrides = {},
}) {
  const publicClient = getPublicClient(config)
  const chainId = publicClient.chain.id
  const addresses = getAddresses(chainId)

  const vseAddress = addresses.vse
  const entryPoint = addresses.entryPoint
  const paymaster = addresses.paymaster
  const resolvedSimpleAccount =
    simpleAccountAddress || overrides.simpleAccountAddress || addresses.simpleAccount

  const defaultVerificationGasLimit = 400_000n
  const defaultPostOpGasLimit = 100_000n
  const defaultCallGas = 10_000_000n
  const defaultPreVerificationGas = 100_000n
  const defaultMaxPriorityFeePerGas = 1_000_000_000n // 1 gwei
  const defaultMaxFeePerGas = 2_000_000_000n // 2 gwei

  const verificationGasLimit =
    overrides.verificationGasLimit !== undefined
      ? BigInt(overrides.verificationGasLimit)
      : defaultVerificationGasLimit
  const postOpGasLimit =
    overrides.postOpGasLimit !== undefined ? BigInt(overrides.postOpGasLimit) : defaultPostOpGasLimit
  const callGasLimit =
    overrides.callGasLimit !== undefined ? BigInt(overrides.callGasLimit) : defaultCallGas
  const preVerificationGas =
    overrides.preVerificationGas !== undefined
      ? BigInt(overrides.preVerificationGas)
      : defaultPreVerificationGas
  const maxPriorityFeePerGas =
    overrides.maxPriorityFeePerGas !== undefined
      ? BigInt(overrides.maxPriorityFeePerGas)
      : defaultMaxPriorityFeePerGas
  const maxFeePerGas =
    overrides.maxFeePerGas !== undefined ? BigInt(overrides.maxFeePerGas) : defaultMaxFeePerGas

  const accountGasLimits = packAccountGasLimits(verificationGasLimit, callGasLimit)
  const gasFees = packGasFees(maxPriorityFeePerGas, maxFeePerGas)
  const paymasterAndData = encodePaymasterAndData({
    paymaster,
    verificationGasLimit,
    postOpGasLimit,
    pollId,
  })

  if (!resolvedSimpleAccount) {
    throw new Error('Simple account address not configured for this chain')
  }
  if (!voterAddress) {
    throw new Error('Voter address is required for sponsored vote')
  }

  // Read current nonce for this smart account from EntryPoint to avoid AA25 invalid account nonce
  let currentNonce = 0n
  try {
    const nonceOnChain = await publicClient.readContract({
      address: entryPoint,
      abi: EntryPointABI,
      functionName: 'getNonce',
      args: [resolvedSimpleAccount, 0n],
    })
    currentNonce = BigInt(nonceOnChain)
  } catch (e) {
    // Fallback to 0 if getNonce is unavailable; better to fail fast later than to silently misbehave
    currentNonce = 0n
  }

  const callData = buildSponsoredVoteCalldata({
    vseAddress,
    simpleAccountAddress: resolvedSimpleAccount,
    pollId,
    optionIdx,
    voterAddress,
  })

  const userOp = {
    sender: resolvedSimpleAccount,
    nonce: overrides.nonce !== undefined ? BigInt(overrides.nonce) : currentNonce,
    initCode: overrides.initCode || '0x',
    callData,
    accountGasLimits,
    preVerificationGas,
    gasFees,
    paymasterAndData,
    signature: overrides.signature || '0x', // placeholder; must be set before submit
  }

  return { userOp, entryPoint }
}

/**
 * Computes the EntryPoint userOpHash for a given UserOperation using
 * EntryPoint.getUserOpHash. The resulting hash should be signed by the
 * account owner and attached to userOp.signature before submission.
 */
export async function getUserOpHash(userOp, entryPointOverride) {
  const publicClient = getPublicClient(config)
  const chainId = publicClient.chain.id
  const addresses = getAddresses(chainId)

  const entryPointAddress = entryPointOverride || addresses.entryPoint

  const hash = await publicClient.readContract({
    address: entryPointAddress,
    abi: EntryPointABI,
    functionName: 'getUserOpHash',
    args: [userOp],
  })

  return hash
}

/**
 * High-level helper: builds, signs and submits a sponsored plain vote
 * UserOperation via the configured EntryPoint and PollSponsorPaymaster.
 *
 * Requirements:
 * - simpleAccountAddress must be an account implementing execute(address,uint256,bytes)
 *   and validateUserOp compatible with the signature produced by walletClient.
 */
export async function sendSponsoredPlainVote({ userOp, entryPoint }) {
  const publicClient = getPublicClient(config)
  const chainId = publicClient.chain.id

  // Convert BigInt fields to strings so JSON.stringify works
  const serializableUserOp = {
    ...userOp,
    nonce: userOp.nonce?.toString?.() ?? userOp.nonce,
    preVerificationGas: userOp.preVerificationGas?.toString?.() ?? userOp.preVerificationGas,
  }

  const response = await fetch('/api/bundler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userOp: serializableUserOp, entryPoint, chainId }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Bundler request failed')
  }

  const data = await response.json()
  const txHash = data.txHash

  // Wait for receipt with retries - bundler transactions may take time to be mined
  let voteId = null
  try {
    const receipt = await waitForTransactionResilient(config, { hash: txHash })

    const voteCastedAbi = [
      {
        type: 'event',
        name: 'VoteCasted',
        inputs: [
          { type: 'uint256', name: 'pollId', indexed: true },
          { type: 'address', name: 'voter', indexed: true },
          { type: 'uint256', name: 'voteId', indexed: false },
        ],
      },
    ]

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: voteCastedAbi,
          data: log.data,
          topics: log.topics,
        })
        if (decoded.eventName === 'VoteCasted' && decoded.args?.voteId !== undefined) {
          voteId = decoded.args.voteId.toString()
          break
        }
      } catch {
        // Not a VoteCasted event, skip
      }
    }
  } catch (err) {
    // If waiting for receipt fails, log warning but still return txHash
    console.warn('Failed to get transaction receipt for voteId extraction:', err.message)
  }

  return { txHash, voteId }
}

