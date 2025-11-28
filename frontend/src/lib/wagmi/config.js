'use client'

import { createConfig } from 'wagmi'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { supportedChains, transports } from './chains'
import { QueryClient } from '@tanstack/react-query'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'local_dev'
const queryClient = new QueryClient()

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports,
  ssr: true,
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'zkVote' }),
  ],
  ...{
    queryClient,
    query: {
      retry: (failureCount, error) => {
        if (error.status === '403') return false
        return failureCount < 3
      },
    },
  },
})