import { useQuery } from '@tanstack/react-query'
import { getWhitelistedPolls, getOwnedPolls } from '@/lib/blockchain/engine/read'
import { isUserWhitelisted } from '@/lib/blockchain/engine/read'

export function useWhitelistedPolls(address, isConnected) {
  const { data: polls = [], isLoading, error } = useQuery({
    queryKey: ['whitelistedPolls', address],
    queryFn: () => getWhitelistedPolls(address),
    enabled: isConnected && !!address,
  })

  return { polls, isLoading, error }
}

export function useOwnedPolls(address, isConnected) {
  const { data: polls = [], isLoading, error } = useQuery({
    queryKey: ['ownedPolls', address],
    queryFn: async () => {
      const data = await getOwnedPolls(address)
      // Check whitelist status for each poll
      const pollsWithWhitelist = await Promise.all(data.map(async (poll) => {
        const isWhitelisted = await isUserWhitelisted(poll.pollId, address)
        return { ...poll, isWhitelisted }
      }))
      return pollsWithWhitelist
    },
    enabled: isConnected && !!address,
  })

  return { polls, isLoading, error }
}
