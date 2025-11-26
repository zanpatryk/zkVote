'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/wagmi/config'
import { rainbowKitConfig } from '@/lib/wagmi/rainbowkit'

const queryClient = new QueryClient() 

export default function Providers({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider {...rainbowKitConfig}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}