'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getPollById, isUserWhitelisted, getZKPollState } from '@/lib/blockchain/engine/read'
import { useUserNFTs } from './useUserNFTs'
import { POLL_STATE } from '@/lib/constants'

/**
 * Hook to manage eligibility and data for minting a poll result NFT.
 * 
 * @param {string} pollId - The ID of the poll.
 * @returns {object} Eligibility states and data.
 */
export function useMintEligibility(pollId) {
  const { address: userAddress, isConnected } = useAccount()
  
  // 1. Fetch Poll Data
  const { data: pollResult = { data: null, error: null }, isLoading: isLoadingPoll, isFetching: isFetchingPoll, error: fetchPollError } = useQuery({
    queryKey: ['poll', pollId?.toString()],
    queryFn: () => getPollById(pollId),
    enabled: !!pollId
  })
  const poll = pollResult.data
  const pollError = fetchPollError || pollResult.error

  // 2. Fetch ZK State (for results published check)
  const { data: zkStateResult = { data: null, error: null }, isLoading: isLoadingZKState, isFetching: isFetchingZKState } = useQuery({
    queryKey: ['zkPollState', pollId?.toString()],
    queryFn: () => getZKPollState(pollId),
    enabled: !!pollId
  })
  const zkState = zkStateResult.data

  // 3. Check Whitelist Status (if not creator)
  const isCreator = poll?.creator?.toLowerCase() === userAddress?.toLowerCase()
  const { data: whitelistResult = { data: false, error: null }, isLoading: isLoadingWhitelist, isFetching: isFetchingWhitelist } = useQuery({
    queryKey: ['isWhitelisted', pollId?.toString(), userAddress],
    queryFn: () => isUserWhitelisted(pollId, userAddress),
    enabled: !!pollId && !!userAddress && !!poll && !isCreator
  })
  const isWhitelisted = !!whitelistResult.data

    // 4. Check Owned NFTs
  const { nfts, isLoading: isLoadingNFTs, refetch: refetchNFTs, isFetching: isFetchingNFTs } = useUserNFTs(userAddress, isConnected)
  const hasMinted = nfts.some(nft => nft.pollId?.toString() === pollId?.toString() || nft.name === `Poll #${pollId} Results`)

  // Computations
  const isWrongState = poll && Number(poll.state) !== POLL_STATE.ENDED
  const isResultsPending = zkState && !zkState.resultsPublished
  const canMint = !!poll && (isCreator || isWhitelisted) && !isWrongState && !isResultsPending

  return {
    poll,
    zkState,
    canMint,
    hasMinted,
    isWrongState,
    isResultsPending,
    isWhitelisted,
    isCreator,
    isLoading: isLoadingPoll || isFetchingPoll || isLoadingZKState || isFetchingZKState || isLoadingWhitelist || isFetchingWhitelist || isLoadingNFTs || isFetchingNFTs,
    error: pollError || zkStateResult.error || whitelistResult.error,
    refetchNFTs
  }
}
