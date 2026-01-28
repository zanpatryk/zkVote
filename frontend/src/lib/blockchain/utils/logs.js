/**
 * RPC providers often have limits on the number of blocks that can be queried in a single getLogs call.
 * This utility splits a large block range into smaller chunks to stay within those limits.
 */

const MAX_RPC_BLOCK_RANGE = 950n // Using 950 to be safe (limit is often 1000)

/**
 * Fetches logs in chunks to avoid RPC limit exceeded errors.
 * 
 * @param {object} publicClient - The viem public client
 * @param {object} options - Standard getLogs options
 * @returns {Array} - Combined logs from all chunks
 */
export async function getLogsChunked(publicClient, options) {
  const { fromBlock, toBlock, ...rest } = options
  
  // If toBlock is not provided or 'latest', we need the current block number
  let endBlock
  if (!toBlock || toBlock === 'latest') {
    endBlock = await publicClient.getBlockNumber()
  } else {
    endBlock = BigInt(toBlock)
  }

  const startBlock = BigInt(fromBlock || 0)
  
  if (startBlock > endBlock) return []

  const logs = []
  let currentFrom = startBlock

  while (currentFrom <= endBlock) {
    const currentTo = (currentFrom + MAX_RPC_BLOCK_RANGE) > endBlock 
      ? endBlock 
      : (currentFrom + MAX_RPC_BLOCK_RANGE)

    const chunk = await publicClient.getLogs({
      ...rest,
      fromBlock: currentFrom,
      toBlock: currentTo
    })

    logs.push(...chunk)
    currentFrom = currentTo + 1n
  }

  return logs
}
