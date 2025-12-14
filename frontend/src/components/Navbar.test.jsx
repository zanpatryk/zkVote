import { render, screen } from '@testing-library/react'
import Navbar from './Navbar.jsx'
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}))

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({
    isConnected: false,
    address: null,
  })),
}))

// Mock ConnectButton
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => <button>Connect Wallet</button>,
}))

describe('Navbar', () => {
  const { useAccount } = require('wagmi')
  const { usePathname } = require('next/navigation')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders logo and connect button when not connected', () => {
    useAccount.mockReturnValue({ isConnected: false })
    usePathname.mockReturnValue('/')

    render(<Navbar />)

    expect(screen.getByText('zkVote')).toBeInTheDocument()
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    // Poll and Vote links should not be visible
    expect(screen.queryByText('Poll')).not.toBeInTheDocument()
    expect(screen.queryByText('Vote')).not.toBeInTheDocument()
  })

  it('renders navigation links when connected', () => {
    useAccount.mockReturnValue({ isConnected: true })
    usePathname.mockReturnValue('/home')

    render(<Navbar />)

    expect(screen.getByText('zkVote')).toBeInTheDocument()
    expect(screen.getByText('Poll')).toBeInTheDocument()
    expect(screen.getByText('Vote')).toBeInTheDocument()
  })

  it('highlights active link', () => {
    useAccount.mockReturnValue({ isConnected: true })
    usePathname.mockReturnValue('/poll')

    render(<Navbar />)

    const pollLink = screen.getByText('Poll')
    expect(pollLink).toHaveClass('text-black', 'font-bold')
    
    const voteLink = screen.getByText('Vote')
    expect(voteLink).not.toHaveClass('text-black', 'font-bold')
  })

  it('redirects to /home if connected and on root page', () => {
    const { useRouter } = require('next/navigation')
    const replaceMock = jest.fn()
    useRouter.mockReturnValue({ replace: replaceMock })
    
    useAccount.mockReturnValue({ isConnected: true })
    usePathname.mockReturnValue('/')

    render(<Navbar />)

    expect(replaceMock).toHaveBeenCalledWith('/home')
  })

  it('redirects to /restricted if not connected and on protected route', () => {
    const { useRouter } = require('next/navigation')
    const replaceMock = jest.fn()
    useRouter.mockReturnValue({ replace: replaceMock })
    
    useAccount.mockReturnValue({ isConnected: false })
    usePathname.mockReturnValue('/poll')

    render(<Navbar />)

    expect(replaceMock).toHaveBeenCalledWith('/restricted')
  })

  it('does not redirect if connected and on protected route', () => {
    const { useRouter } = require('next/navigation')
    const replaceMock = jest.fn()
    useRouter.mockReturnValue({ replace: replaceMock })
    
    useAccount.mockReturnValue({ isConnected: true })
    usePathname.mockReturnValue('/poll')

    render(<Navbar />)

    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('does not redirect if not connected and on public route', () => {
    const { useRouter } = require('next/navigation')
    const replaceMock = jest.fn()
    useRouter.mockReturnValue({ replace: replaceMock })
    
    useAccount.mockReturnValue({ isConnected: false })
    usePathname.mockReturnValue('/')

    render(<Navbar />)

    expect(replaceMock).not.toHaveBeenCalled()
  })
})
