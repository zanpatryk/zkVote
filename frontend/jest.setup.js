import '@testing-library/jest-dom'

class MockWorker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }
  postMessage(msg) {
    // Basic echo for testing if needed, or no-op
  }
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

if (typeof window !== 'undefined') {
  window.Worker = MockWorker
}
global.Worker = MockWorker
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock IntersectionObserver for framer-motion whileInView
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {
    // Immediately trigger as visible for testing purposes
    this.callback([{ isIntersecting: true }])
    return null
  }
  unobserve() { return null }
  disconnect() { return null }
}

if (typeof window !== 'undefined') {
  window.IntersectionObserver = MockIntersectionObserver
}
global.IntersectionObserver = MockIntersectionObserver

// Suppress framer-motion prop warnings in tests (whileHover, whileTap, etc.)
// These are valid props for motion components but React warns because JSDOM doesn't understand them
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (
    message.includes('whileHover') ||
    message.includes('whileTap') ||
    message.includes('whileFocus') ||
    message.includes('whileDrag') ||
    message.includes('whileInView')
  ) {
    return // Suppress known framer-motion warnings
  }
  originalConsoleError.apply(console, args)
}

jest.mock('wagmi', () => {
  const mock = {
    http: jest.fn(() => 'http-transport'),
    useAccount: jest.fn(() => ({ isConnected: true, address: '0x123' })),
    useReadContract: jest.fn(),
    useReadContracts: jest.fn(),
    useWriteContract: jest.fn(),
    useWaitForTransactionReceipt: jest.fn(),
    createConfig: jest.fn(),
    wagmiConfig: {},
    useBalance: jest.fn(),
    useSignMessage: jest.fn(),
    useDisconnect: jest.fn(),
    useConnect: jest.fn(),
    useChainId: jest.fn(() => 11155111), // Default to Sepolia
  }
  return {
    __esModule: true,
    ...mock,
    default: mock,
  }
})

jest.mock('wagmi/chains', () => {
  const mock = {
    sepolia: { id: 11155111, name: 'Sepolia', testnet: true },
    mainnet: { id: 1, name: 'Mainnet' },
    localhost: { id: 1337, name: 'Localhost' },
    anvil: { id: 31337, name: 'Anvil', testnet: true },
  }
  return {
    __esModule: true,
    ...mock,
    default: mock,
  }
})

jest.mock('@wagmi/core', () => {
  const mock = {
    readContract: jest.fn(),
    writeContract: jest.fn(),
    waitForTransactionReceipt: jest.fn(),
    getAccount: jest.fn(() => ({ address: '0x123', chainId: 11155111 })),
    createConfig: jest.fn(),
    http: jest.fn(),
  }
  return {
    __esModule: true,
    ...mock,
    default: mock,
  }
})

jest.mock('viem', () => {
  const mock = {
    defineChain: jest.fn((c) => c),
    parseEther: jest.fn(),
    formatEther: jest.fn(),
    parseAbiParameters: jest.fn(),
    encodeAbiParameters: jest.fn(),
    createPublicClient: jest.fn(),
    http: jest.fn(),
    parseAbiItem: jest.fn(i => i),
    isAddress: jest.fn(() => true),
    encodeFunctionData: jest.fn(() => '0xEncodedFunctionData'),
    decodeEventLog: jest.fn(() => ({ eventName: 'VoteCasted', args: { voteId: 123n } })),
  }
  return {
    __esModule: true,
    ...mock,
    default: mock,
  }
})

jest.mock('@rainbow-me/rainbowkit', () => {
  const mock = {
    ConnectButton: () => 'ConnectButton',
    getDefaultConfig: jest.fn(),
    RainbowKitProvider: ({children}) => children,
  }
  return {
    __esModule: true,
    ...mock,
    default: mock,
  }
})
