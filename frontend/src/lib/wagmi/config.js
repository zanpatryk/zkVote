'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { supportedChains, transports } from './chains'

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'local_dev'

export const wagmiConfig = getDefaultConfig({
  appName: 'zkVote',
  projectId,
  chains: supportedChains,
  transports,
  ssr: true,
})