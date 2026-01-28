import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import EntryPointABI from '@/lib/contracts/abis/EntryPoint.json'
import { anvil, supportedChains } from '@/lib/wagmi/chains'

export async function POST(request) {
  try {
    const { userOp: rawUserOp, entryPoint, chainId } = await request.json()

    if (!rawUserOp || !entryPoint || !chainId) {
      return NextResponse.json({ error: 'Missing userOp, entryPoint or chainId' }, { status: 400 })
    }

    const pk = process.env.BUNDLER_PRIVATE_KEY
    if (!pk) {
      return NextResponse.json({ error: 'BUNDLER_PRIVATE_KEY not configured' }, { status: 500 })
    }

    const chain =
      supportedChains.find((c) => c.id === Number(chainId)) ||
      anvil

    const rpcUrl = chain.rpcUrls?.default?.http?.[0] || 'http://127.0.0.1:8545'
    const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`)

    const client = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    })

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    })

    // Restore BigInt fields on the server
    const userOp = {
      ...rawUserOp,
      nonce: rawUserOp.nonce !== undefined ? BigInt(rawUserOp.nonce) : rawUserOp.nonce,
      preVerificationGas:
        rawUserOp.preVerificationGas !== undefined
          ? BigInt(rawUserOp.preVerificationGas)
          : rawUserOp.preVerificationGas,
    }

    // Compute userOpHash via EntryPoint
    const userOpHash = await publicClient.readContract({
      address: entryPoint,
      abi: EntryPointABI,
      functionName: 'getUserOpHash',
      args: [userOp],
    })

    // Sign the hash with the bundler / owner key
    const signature = await client.signMessage({
      account,
      message: { raw: userOpHash },
    })

    const signedUserOp = {
      ...userOp,
      signature,
    }

    const txHash = await client.writeContract({
      address: entryPoint,
      abi: EntryPointABI,
      functionName: 'handleOps',
      args: [[signedUserOp], account.address],
    })

    return NextResponse.json({ txHash })
  } catch (error) {
    console.error('Bundler route error:', error)
    return NextResponse.json({ error: error.message || 'Bundler error' }, { status: 500 })
  }
}

