import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { parseEther } from 'viem'
import { getPollBudget, fundPollBudget, withdrawPollBudget } from '@/lib/blockchain/engine/paymaster'
import { formatTransactionError } from '@/lib/blockchain/utils/error-handler'

/**
 * Hook to manage poll funding state (budget, fund, withdraw).
 */
export function usePollFunding(pollId) {
  const [balance, setBalance] = useState(0n)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const refreshBalance = useCallback(async () => {
    if (!pollId && pollId !== 0) return
    setIsLoadingBalance(true)
    try {
      const { data, error } = await getPollBudget(pollId)
      if (error) {
        toast.error(error)
      } else {
        setBalance(data ?? 0n)
      }
    } catch (error) {
      console.error('Failed to refresh poll budget:', error)
      toast.error('Failed to refresh poll funding balance.')
    } finally {
      setIsLoadingBalance(false)
    }
  }, [pollId])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  const fund = useCallback(
    async (amountEth) => {
      if (!pollId && pollId !== 0) return
      if (!amountEth || Number(amountEth) <= 0) {
        toast.error('Please enter a positive amount of ETH.')
        return
      }

      let amountWei
      try {
        amountWei = parseEther(amountEth.toString())
      } catch (error) {
        toast.error('Invalid ETH amount.')
        return
      }

      setIsFunding(true)
      const toastId = toast.loading('Funding poll...')

      try {
        await fundPollBudget(pollId, amountWei)
        toast.success('Poll funded successfully!', { id: toastId })
        await refreshBalance()
      } catch (error) {
        console.error('Failed to fund poll:', error)
        toast.error(formatTransactionError(error, 'Failed to fund poll'), { id: toastId })
      } finally {
        setIsFunding(false)
      }
    },
    [pollId, refreshBalance]
  )

  const withdrawAll = useCallback(async () => {
    if (!pollId && pollId !== 0) return
    if (balance <= 0n) {
      toast.error('No funds available to withdraw.')
      return
    }

    setIsWithdrawing(true)
    const toastId = toast.loading('Withdrawing poll funds...')

    try {
      await withdrawPollBudget(pollId, balance)
      toast.success('Funds withdrawn successfully!', { id: toastId })
      await refreshBalance()
    } catch (error) {
      console.error('Failed to withdraw poll funds:', error)
      toast.error(formatTransactionError(error, 'Failed to withdraw poll funds'), { id: toastId })
    } finally {
      setIsWithdrawing(false)
    }
  }, [pollId, balance, refreshBalance])

  return {
    balance,
    isLoadingBalance,
    isFunding,
    isWithdrawing,
    refreshBalance,
    fund,
    withdrawAll,
  }
}

