/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// --- MOCKS ---

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, init })),
  },
}))

jest.mock('viem', () => ({
  createWalletClient: jest.fn(),
  createPublicClient: jest.fn(),
  http: jest.fn(),
}))

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(),
}))

jest.mock('@/lib/wagmi/chains', () => ({
  supportedChains: [{ id: 31337, rpcUrls: { default: { http: ['mock-rpc'] } } }],
  anvil: { id: 31337 },
}))

// --- TESTS ---

describe('Bundler API Route', () => {
  const mockReq = (body) => ({
    json: jest.fn().mockResolvedValue(body),
  })

  const mockClient = {
    signMessage: jest.fn(),
    writeContract: jest.fn(),
  }

  const mockPublicClient = {
    readContract: jest.fn(),
  }

  const mockAccount = { address: '0xBundler' }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.BUNDLER_PRIVATE_KEY = '0x123'
    
    createWalletClient.mockReturnValue(mockClient)
    createPublicClient.mockReturnValue(mockPublicClient)
    privateKeyToAccount.mockReturnValue(mockAccount)
  })

  it('preserves BigInt fields when processing userOp', async () => {
    const userOp = { 
        sender: '0xSender', 
        nonce: '123', // String that should become BigInt
        preVerificationGas: 50000 // Number that should become BigInt
    }
    const req = mockReq({ userOp, entryPoint: '0xEntry', chainId: 31337 })
    
    mockPublicClient.readContract.mockResolvedValue('0xHash')
    mockClient.signMessage.mockResolvedValue('0xSig')
    mockClient.writeContract.mockResolvedValue('0xTxHash')

    await POST(req)

    // Check getUserOpHash call
    const userOpPassedToHash = mockPublicClient.readContract.mock.calls[0][0].args[0]
    expect(typeof userOpPassedToHash.nonce).toBe('bigint')
    expect(typeof userOpPassedToHash.preVerificationGas).toBe('bigint')
    expect(userOpPassedToHash.nonce).toBe(123n)
  })

  it('returns 200 and txHash on success', async () => {
    const userOp = { sender: '0xSender', nonce: 0 }
    const req = mockReq({ userOp, entryPoint: '0xEntry', chainId: 31337 })
    
    mockPublicClient.readContract.mockResolvedValue('0xUserOpHash')
    mockClient.signMessage.mockResolvedValue('0xSignature')
    mockClient.writeContract.mockResolvedValue('0xTxHash')

    const res = await POST(req)
    
    expect(res.body).toEqual({ txHash: '0xTxHash' })
    
    // Verify flow
    expect(privateKeyToAccount).toHaveBeenCalledWith('0x123')
    expect(mockPublicClient.readContract).toHaveBeenCalled()
    expect(mockClient.signMessage).toHaveBeenCalledWith({
        account: mockAccount,
        message: { raw: '0xUserOpHash' }
    })
    expect(mockClient.writeContract).toHaveBeenCalled()
  })

  it('returns 400 if arguments are missing', async () => {
    // Missing chainId
    const req = mockReq({ userOp: {}, entryPoint: '0xEntry' }) 
    const res = await POST(req)
    
    expect(res.init.status).toBe(400)
    expect(res.body.error).toMatch(/Missing/)
  })

  it('returns 500 if BUNDLER_PRIVATE_KEY is missing', async () => {
    delete process.env.BUNDLER_PRIVATE_KEY
    const req = mockReq({ userOp: {}, entryPoint: '0xEntry', chainId: 1 })
    
    const res = await POST(req)
    
    expect(res.init.status).toBe(500)
    expect(res.body.error).toMatch(/not configured/)
  })

  it('returns 500 if writeContract fails', async () => {
    const req = mockReq({ userOp: { nonce: 0 }, entryPoint: '0xEntry', chainId: 31337 })
    
    mockPublicClient.readContract.mockResolvedValue('0xHash')
    mockClient.signMessage.mockResolvedValue('0xSig')
    mockClient.writeContract.mockRejectedValue(new Error('Bundler revert'))

    const res = await POST(req)
    
    expect(res.init.status).toBe(500)
    expect(res.body.error).toBe('Bundler revert')
  })
})
