import { render, screen, waitFor } from '@testing-library/react'
import Navbar from '../src/components/Navbar.jsx'
import '@testing-library/jest-dom'

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPathname = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname(),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}))

describe('Integration Test: Navigation & Wallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows Landing Page when not connected', () => {
    mockUseAccount.mockReturnValue({ isConnected: false, address: undefined })
    mockPathname.mockReturnValue('/')

    render(<Navbar />)

    expect(screen.getByText('zkVote')).toBeInTheDocument()
    expect(screen.queryByText('Poll')).not.toBeInTheDocument()
    expect(screen.queryByText('Vote')).not.toBeInTheDocument()
  })

  it('redirects to /home when connected on landing page', async () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    mockPathname.mockReturnValue('/')

    render(<Navbar />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home')
    })
  })

  it('shows navigation links when connected', () => {
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0x123' })
    mockPathname.mockReturnValue('/home')

    render(<Navbar />)

    expect(screen.getByText('Poll')).toBeInTheDocument()
    expect(screen.getByText('Vote')).toBeInTheDocument()
  })

  it('redirects to /restricted when accessing protected route while disconnected', async () => {
    mockUseAccount.mockReturnValue({ isConnected: false, address: undefined })
    mockPathname.mockReturnValue('/poll')

    render(<Navbar />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })
})
