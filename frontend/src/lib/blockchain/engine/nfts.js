import { getPublicClient, writeContract, getAccount } from '@wagmi/core'
import { waitForTransactionResilient } from '@/lib/blockchain/utils/transaction'
import { wagmiConfig as config } from '@/lib/wagmi/config'
import { parseAbiItem } from 'viem'
import { 
  votingSystemContract, 
  ResultNFTABI,
  getAddresses
} from '@/lib/contracts'

import { getLogsChunked } from '@/lib/blockchain/utils/logs'

// --- READS ---

export async function getUserNFTs(userAddress) {
  if (!userAddress) return { data: [], error: null }
  try {
    const account = getAccount(config)
    const chainId = account?.chainId
    const publicClient = getPublicClient(config, { chainId })
    const addresses = getAddresses(publicClient.chain.id)
    const resultNFTAddress = await publicClient.readContract({
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 's_resultNFT',
    })
    const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)')
    const logs = await getLogsChunked(publicClient, {
      address: resultNFTAddress,
      event: transferEventAbi,
      args: { to: userAddress },
      fromBlock: BigInt(addresses.startBlock || 0)
    })
    const tokenIds = [...new Set(logs.map(log => log.args.tokenId))]
    const nfts = await Promise.all(
      tokenIds.map(async (tokenId) => {
        try {
          const tokenURI = await publicClient.readContract({
            address: resultNFTAddress,
            abi: ResultNFTABI,
            functionName: 'tokenURI',
            args: [tokenId]
          })
          const jsonPart = tokenURI.replace('data:application/json;base64,', '')
          if (!jsonPart) return { tokenId: tokenId.toString(), name: `NFT #${tokenId}`, description: 'No Metadata' }
          const metadata = JSON.parse(atob(jsonPart))
          return { tokenId: tokenId.toString(), ...metadata }
        } catch (e) {
          return { tokenId: tokenId.toString(), name: `NFT #${tokenId}`, error: true }
        }
      })
    )
    return { data: nfts, error: null }
  } catch (err) {
    console.error('getUserNFTs failed:', err)
    return { data: [], error: 'Could not connect to blockchain. Please check your network.' }
  }
}

// --- WRITES ---

export async function mintResultNFT(pollId) {
  const { address } = getAccount(config)
  if (!address) throw new Error('Wallet not connected')

  try {
    const { chainId } = getAccount(config)
    const addresses = getAddresses(chainId)

    const hash = await writeContract(config, {
      address: addresses.vse,
      abi: votingSystemContract.abi,
      functionName: 'mintResultNFT',
      args: [BigInt(pollId)],
    })
    await waitForTransactionResilient(config, { hash })
  } catch (error) {
    console.error('mintResultNFT failed:', error)
    throw error
  }
}
