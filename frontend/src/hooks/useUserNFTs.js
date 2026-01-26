import { useQuery } from '@tanstack/react-query'
import { getUserNFTs } from '@/lib/blockchain/engine/read'

/**
 * Hook to fetch NFTs owned by a user.
 * 
 * @param {string} address - The wallet address of the user.
 * @param {boolean} isConnected - Whether the wallet is connected.
 * @returns {{ nfts: Array, isLoading: boolean, error: string|null, refetch: Function }}
 */
export function useUserNFTs(address, isConnected) {
  const { data: result = { data: [], error: null }, isLoading, isFetching, error: queryError, refetch } = useQuery({
    queryKey: ['userNFTs', address],
    queryFn: () => getUserNFTs(address),
    enabled: isConnected && !!address,
  })

  return { 
    nfts: result.data || [], 
    isLoading, 
    isFetching,
    error: queryError || result.error,
    refetch 
  }
}
