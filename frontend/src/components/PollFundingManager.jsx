"use client"

import { useState } from 'react'
import { formatEther } from 'viem'
import { POLL_STATE } from '@/lib/constants'
import { usePollFunding } from '@/hooks/usePollFunding'

export default function PollFundingManager({ pollId, status }) {
  const { balance, isLoadingBalance, isFunding, isWithdrawing, fund, withdrawAll } = usePollFunding(pollId)
  const [isFundModalOpen, setIsFundModalOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')

  const isFundable = status === POLL_STATE.CREATED || status === POLL_STATE.ACTIVE
  const isEnded = status === POLL_STATE.ENDED

  const displayBalance = (() => {
    try {
      return `${formatEther(balance || 0n)} ETH`
    } catch {
      return '0 ETH'
    }
  })()

  const handleOpenFundModal = () => {
    setFundAmount('')
    setIsFundModalOpen(true)
  }

  const handleConfirmFund = async () => {
    await fund(fundAmount)
    setIsFundModalOpen(false)
  }

  return (
    <div className="bg-white p-8 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
      <h3 className="text-2xl font-serif font-bold mb-4">Poll Funding</h3>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-gray-500">Current Budget</p>
          <p className="text-xl font-bold text-black border-b-2 border-black/10">
            {isLoadingBalance ? 'Loading...' : displayBalance}
          </p>
          <p className="mt-2 text-sm text-gray-600 max-w-md">
            Funds here are used by the account abstraction paymaster to sponsor voters&apos; gas fees for this poll.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isFundable && (
            <button
              type="button"
              onClick={handleOpenFundModal}
              disabled={isFunding}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:shadow-none active:translate-x-[2px]"
            >
              {isFunding ? 'Funding...' : 'Fund Poll'}
            </button>
          )}

          {isEnded && (
            <button
              type="button"
              onClick={withdrawAll}
              disabled={isWithdrawing || balance === 0n}
              className="px-6 py-3 border-2 border-black bg-white text-black rounded-lg hover:bg-red-50 disabled:opacity-50 transition font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5"
            >
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw Funds'}
            </button>
          )}
        </div>
      </div>

      {isFundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-6 mx-4">
            <h4 className="text-xl font-serif font-bold mb-4">Fund Poll</h4>
            <p className="text-sm text-gray-600 mb-4">
              Choose how many ETH you want to deposit into the paymaster budget for this poll.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (ETH)
              <input
                type="number"
                min="0"
                step="0.001"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="mt-1 block w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="0.1"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFundModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border-2 border-black bg-white hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFund}
                disabled={isFunding}
                className="px-5 py-2 text-sm rounded-lg bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                {isFunding ? 'Funding...' : 'Confirm Funding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

