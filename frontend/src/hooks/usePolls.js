import { useQuery } from '@tanstack/react-query'
import { getWhitelistedPolls, getOwnedPolls, getPollById } from '@/lib/blockchain/engine/read'
import { isUserWhitelisted } from '@/lib/blockchain/engine/read'

export function useWhitelistedPolls(address, isConnected) {
  const { data: result = { data: [], error: null }, isLoading, error: queryError } = useQuery({
    queryKey: ['whitelistedPolls', address],
    queryFn: () => getWhitelistedPolls(address),
    enabled: isConnected && !!address,
  })

  return { polls: result.data || [], isLoading, error: queryError || result.error }
}

export function useOwnedPolls(address, isConnected) {
  const { data: result = { data: [], error: null }, isLoading, error: queryError } = useQuery({
    queryKey: ['ownedPolls', address],
    queryFn: async () => {
      const { data, error } = await getOwnedPolls(address)
      if (error || !data) return { data: [], error }
      
      // Check whitelist status for each poll
      const pollsWithWhitelist = await Promise.all(data.map(async (poll) => {
        const { data: isWhitelisted } = await isUserWhitelisted(poll.pollId, address)
        return { ...poll, isWhitelisted }
      }))
      return { data: pollsWithWhitelist, error: null }
    },
    enabled: isConnected && !!address,
  })

  return { polls: result.data || [], isLoading, error: queryError || result.error }
}

export function usePoll(pollId) {
  const { data: result = { data: null, error: null }, isLoading, error: queryError } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: () => getPollById(pollId),
    enabled: !!pollId,
  })

  return { poll: result.data, isLoading, error: queryError || result.error }
}
