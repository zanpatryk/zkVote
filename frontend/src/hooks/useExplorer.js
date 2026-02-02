'use client'

import { useChainId } from 'wagmi'
import { getExplorerTxUrl, getExplorerAddressUrl } from '@/lib/utils/explorer'

/**
 * Hook that returns chain-aware explorer URL functions.
 * Automatically uses the currently connected chain.
 * 
 * @returns {{ getTxUrl: (txHash: string) => string, getAddressUrl: (address: string) => string }}
 */
export function useExplorer() {
  const chainId = useChainId()

  return {
    getTxUrl: (txHash) => getExplorerTxUrl(txHash, chainId),
    getAddressUrl: (address) => getExplorerAddressUrl(address, chainId),
    chainId,
  }
}
