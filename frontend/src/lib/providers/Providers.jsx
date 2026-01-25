'use client'

import { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { IdentityTransferProvider } from '@/lib/providers/IdentityTransferContext'
import { wagmiConfig } from '@/lib/wagmi/config'

// Custom RainbowKit theme - Premium Monochrome
const customTheme = {
  fonts: {
    body: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  radii: {
    connectButton: '8px',
    menuButton: '8px',
    modal: '12px',
    modalMobile: '12px',
  },
  shadows: {
    connectButton: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
    dialog: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
  },
  colors: {
    accentColor: '#000000',
    accentColorForeground: '#ffffff',
    actionButtonBorder: 'rgba(0, 0, 0, 1)',
    actionButtonBorderMobile: 'rgba(0, 0, 0, 1)',
    actionButtonSecondaryBackground: '#ffffff',
    closeButton: '#000000',
    closeButtonBackground: '#ffffff',
    connectButtonBackground: '#ffffff',
    connectButtonBackgroundError: '#ff0000',
    connectButtonInnerBackground: '#ffffff',
    connectButtonText: '#000000',
    connectButtonTextError: '#ffffff',
    connectionIndicator: '#000000',
    error: '#ff0000',
    generalBorder: '#000000',
    generalBorderDim: 'rgba(0, 0, 0, 0.3)',
    menuItemBackground: '#ffffff',
    modalBackdrop: 'rgba(0, 0, 0, 0.5)',
    modalBackground: '#ffffff',
    modalBorder: '#000000',
    modalText: '#000000',
    modalTextDim: 'rgba(0, 0, 0, 0.6)',
    modalTextSecondary: 'rgba(0, 0, 0, 0.6)',
    profileAction: '#ffffff',
    profileActionHover: '#f5f5f5',
    profileForeground: '#ffffff',
    selectedOptionBorder: '#000000',
    standby: '#000000',
  },
}

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error.status === '403') return false
          return failureCount < 3
        },
      },
    },
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent SSR issues with WalletConnect localStorage
  if (!mounted) {
    return null
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          <IdentityTransferProvider>
            {children}
          </IdentityTransferProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}