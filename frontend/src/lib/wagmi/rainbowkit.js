'use client'                     

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from './config'

export const rainbowKitConfig = getDefaultConfig({
  appName: 'zkVote',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'local_dev',
  chains: wagmiConfig.chains,
})