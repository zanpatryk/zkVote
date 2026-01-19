"use client"

import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useAccount } from 'wagmi'
import { useSemaphore } from '@/hooks/useSemaphore'
import { usePollRegistry } from '@/hooks/usePollRegistry'
import { POLL_STATE } from '@/lib/constants'
import CONTRACT_ADDRESSES from '@/lib/contracts/addresses'

export default function PollCard({ pollId, title, state, isOwner = false, showVoteButton = false, interactive = true }) {
  const { address } = useAccount()
  const { createIdentity, register, isLoadingIdentity, isRegistering } = useSemaphore()
  const { isZK, isRegistered, eligibilityModuleAddress, voteStorageAddress, resultsPublished } = usePollRegistry(pollId)
  
  const isAnonymous = eligibilityModuleAddress?.toLowerCase() === CONTRACT_ADDRESSES.semaphoreEligibility?.toLowerCase()
  const isSecret = voteStorageAddress?.toLowerCase() === CONTRACT_ADDRESSES.zkElGamalVoteVector?.toLowerCase()

  const canRegister = isZK && !isRegistered && state === POLL_STATE.CREATED

  const handleRegister = async () => {
    const identity = await createIdentity(pollId)
    if (identity) {
      await register(pollId)
    }
  }

  // State to label mapping
  const statusLabel = 'Status'
  const statusValue = {
    [POLL_STATE.CREATED]: 'Created',
    [POLL_STATE.ACTIVE]: 'Active',
    [POLL_STATE.ENDED]: 'Ended',
  }[state] || null

  const handleCopy = (e) => {
    e.preventDefault()
    if (!interactive) return
    navigator.clipboard.writeText(pollId.toString())
    toast.success('Poll ID copied!')
  }

  // Helper to treat content as link or static div
  const InteractiveLink = ({ href, children }) => {
    if (!interactive) return <div className="cursor-default">{children}</div>
    return <Link href={href}>{children}</Link>
  }

  return (
    <div className={`p-6 md:p-8 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight flex items-center gap-3">
            {title}
            <div className="flex gap-2">
              {isAnonymous && (
                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter border border-gray-200 rounded-sm">
                  Anonymous
                </span>
              )}
              {isSecret && (
                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter border border-gray-200 rounded-sm">
                  Secret
                </span>
              )}
            </div>
          </h3>
          <div className="mt-3 flex items-center gap-3 text-gray-600">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 border border-black/20 px-2 py-1 rounded-sm" title={pollId.toString()}>
            ID: {pollId.toString().length <= 8
              ? pollId.toString()
              : `${pollId.toString().slice(0, 4)}...${pollId.toString().slice(-4)}`}
            </span>
            <button
              onClick={handleCopy}
              className={`p-1 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200 ${!interactive ? 'cursor-default' : ''}`}
              title="Copy Poll ID"
              disabled={!interactive}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
              </svg>
            </button>
          </div>
          {statusLabel && statusValue && (
            <div className="mt-3 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${state === POLL_STATE.ACTIVE ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                 <p className="text-sm font-medium uppercase tracking-wide text-gray-600">{statusValue}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {isRegistered && (
              <span className="bg-gray-100 text-black text-xs font-bold px-3 py-1 uppercase tracking-widest border border-black/20">
                Registered
              </span>
            )}
            {isOwner && (
              <span className="bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-widest border border-black">
                Owner
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-6 border-t-2 border-black/5 pt-6 items-center">
        {isOwner ? (
          <InteractiveLink href={`/poll/${pollId}/manage`}>
            <span className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
              Manage Poll
            </span>
          </InteractiveLink>
        ) : (
          <InteractiveLink href={`/poll/${pollId}`}>
            <span className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
              View Details
            </span>
          </InteractiveLink>
        )}

        {state === POLL_STATE.ENDED && (!isSecret || resultsPublished) ? (
          <InteractiveLink href={`/poll/${pollId}/nft`}>
            <span className="text-black font-semibold hover:underline decoration-2 underline-offset-4">
              Mint Result NFT
            </span>
          </InteractiveLink>
        ) : showVoteButton ? (
          <>
            {state === POLL_STATE.CREATED && canRegister && (
              <InteractiveLink href={`/poll/${pollId}/register`}>
                <span className="bg-black text-white px-6 py-2 rounded-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all text-sm uppercase tracking-wide">
                  Register Identity
                </span>
              </InteractiveLink>
            )}
            
            {state === POLL_STATE.ACTIVE && (isRegistered || !isZK) && (
              <InteractiveLink href={`/poll/${pollId}/vote`}>
                <span className="bg-black text-white px-6 py-2 rounded-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all text-sm uppercase tracking-wide">
                  Vote Now
                </span>
              </InteractiveLink>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}