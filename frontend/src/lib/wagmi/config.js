'use client'

import { createConfig } from 'wagmi'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'
import { supportedChains, transports } from './chains'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'local_dev'

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports,
  ssr: true,
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'zkVote' }),
  ],

})