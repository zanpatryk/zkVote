import { render, screen } from '@testing-library/react'
import Providers from './Providers'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'

// We need to mock these to avoid rendering the actual complex providers
jest.mock('wagmi', () => ({
  WagmiProvider: jest.fn(({ children }) => <div data-testid="wagmi-provider">{children}</div>),
}))

jest.mock('@tanstack/react-query', () => {
    const original = jest.requireActual('@tanstack/react-query')
    return {
        ...original,
        QueryClientProvider: jest.fn(({ children }) => <div data-testid="query-client-provider">{children}</div>),
        QueryClient: jest.fn().mockImplementation(() => ({
            defaultOptions: {
                queries: {
                    retry: jest.fn()
                }
            }
        }))
    }
})

jest.mock('@rainbow-me/rainbowkit', () => ({
  RainbowKitProvider: jest.fn(({ children }) => <div data-testid="rainbowkit-provider">{children}</div>),
}))

jest.mock('@/lib/wagmi/config', () => ({
  wagmiConfig: {},
}))

describe('Providers', () => {
  it('renders children after mounting', () => {
    render(
      <Providers>
        <div data-testid="test-child">Child Content</div>
      </Providers>
    )

    // Initially it might be null due to !mounted, but useEffect runs immediately in JSDOM
    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByTestId('wagmi-provider')).toBeInTheDocument()
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument()
    expect(screen.getByTestId('rainbowkit-provider')).toBeInTheDocument()
  })

  it('configures QueryClient with retry logic', () => {
    const { QueryClient } = require('@tanstack/react-query')
    render(
      <Providers>
        <div>Child</div>
      </Providers>
    )

    const queryClientInstance = QueryClient.mock.calls[0][0]
    const retry = queryClientInstance.defaultOptions.queries.retry

    // Test retry logic
    expect(retry(0, { status: '403' })).toBe(false)
    expect(retry(0, { status: '500' })).toBe(true)
    expect(retry(2, { status: '500' })).toBe(true)
    expect(retry(3, { status: '500' })).toBe(false)
  })
})
