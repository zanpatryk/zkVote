import { writeContract, waitForTransactionReceipt, getAccount } from '@wagmi/core'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { createHttpPublicClient } from '@/lib/wagmi/chains'
import { getAddresses, pollManagerContract } from '@/lib/contracts'
import PollSponsorPaymasterABI from '@/lib/contracts/abis/PollSponsorPaymaster.json'
import { getModules } from './core'

/**
 * Reads the current sponsored budget (in wei) for a given poll.
 */
export async function getPollBudget(pollId) {
  if (!pollId && pollId !== 0) return { data: 0n, error: null }

  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const addresses = getAddresses(chainId)

    const amount = await publicClient.readContract({
      address: addresses.paymaster,
      abi: PollSponsorPaymasterABI,
      functionName: 's_pollBudgets',
      args: [BigInt(pollId)],
    })

    return { data: amount, error: null }
  } catch (err) {
    console.error('getPollBudget failed:', err)
    return { data: 0n, error: 'Failed to fetch poll budget.' }
  }
}

/**
 * Funds the poll budget via the PollSponsorPaymaster.
 * @param {string|number} pollId
 * @param {bigint} amountWei
 */
export async function fundPollBudget(pollId, amountWei) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const { chainId } = getAccount(config)
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.paymaster,
      abi: PollSponsorPaymasterABI,
      functionName: 'fundPoll',
      args: [BigInt(pollId)],
      value: amountWei,
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) {
      throw new Error('Transaction REVERTED on chain.')
    }

    return true
  } catch (err) {
    console.error('fundPollBudget failed:', err)
    throw err
  }
}

/**
 * Withdraws funds from the poll budget back to the poll owner (caller).
 * @param {string|number} pollId
 * @param {bigint} amountWei
 */
export async function withdrawPollBudget(pollId, amountWei) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const account = getAccount(config)
    const chainId = account?.chainId || config?.state?.chainId || 11155111
    const publicClient = createHttpPublicClient(chainId)
    const addresses = getAddresses(chainId)

    // Debug: Check on-chain values before attempting withdraw
    const { pollManager } = await getModules(pollId)
    const [budgetOnChain, pollOwnerOnChain] = await Promise.all([
      publicClient.readContract({
        address: addresses.paymaster,
        abi: PollSponsorPaymasterABI,
        functionName: 's_pollBudgets',
        args: [BigInt(pollId)],
      }).catch(() => 0n),
      publicClient.readContract({
        address: pollManager,
        abi: pollManagerContract.abi,
        functionName: 'getPollOwner',
        args: [BigInt(pollId)],
      }).catch(() => null),
    ])

    // Also check EntryPoint deposit (needed for withdrawTo to work)
    const entryPointDeposit = await publicClient.readContract({
      address: addresses.entryPoint,
      abi: [{ type: 'function', name: 'balanceOf', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' }],
      functionName: 'balanceOf',
      args: [addresses.paymaster],
    }).catch(() => 0n)

    console.log('[withdrawPollBudget] Debug info:', {
      pollId,
      connectedAddress: address,
      pollOwnerOnChain,
      budgetOnChain: budgetOnChain.toString(),
      entryPointDeposit: entryPointDeposit.toString(),
      requestedAmount: amountWei.toString(),
      addressesMatch: address?.toLowerCase() === pollOwnerOnChain?.toLowerCase(),
    })

    if (budgetOnChain === 0n) {
      throw new Error('No budget available to withdraw. All funds may have been consumed by sponsored votes.')
    }

    if (address?.toLowerCase() !== pollOwnerOnChain?.toLowerCase()) {
      throw new Error(
        `Address mismatch: Connected wallet (${address}) is not the poll owner (${pollOwnerOnChain}). ` +
        'Please connect with the account that created this poll.'
      )
    }

    // The contract will automatically cap withdrawal to min(budget, deposit), so we just warn
    if (entryPointDeposit < budgetOnChain) {
      console.warn(
        `[withdrawPollBudget] EntryPoint deposit (${entryPointDeposit.toString()} wei) is less than ` +
        `tracked budget (${budgetOnChain.toString()} wei). ` +
        'The contract will withdraw the available deposit amount.'
      )
    }

    const hash = await writeContract(config, {
      address: addresses.paymaster,
      abi: PollSponsorPaymasterABI,
      functionName: 'withdrawPoll',
      args: [BigInt(pollId), address, amountWei],
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    if (receipt.status === 'reverted' || receipt.status === 0) {
      throw new Error('Transaction REVERTED on chain.')
    }

    return true
  } catch (err) {
    console.error('withdrawPollBudget failed:', err)
    throw err
  }
}

