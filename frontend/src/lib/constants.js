/**
 * ElGamal vote vector size - must match elGamalVoteVector_N16 circuit
 */
export const ELGAMAL_VECTOR_SIZE = 16

/**
 * Zero address constant
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Poll states
 */
export const POLL_STATE = {
  CREATED: 0,
  ACTIVE: 1,
  ENDED: 2,
}

/**
 * Block explorer URLs by chain ID
 */
export const BLOCK_EXPLORERS = {
  1: 'https://etherscan.io',           // Ethereum Mainnet
  11155111: 'https://sepolia.etherscan.io',  // Sepolia
  31337: 'https://sepolia.etherscan.io',     // Hardhat/Anvil (fallback to Sepolia for local dev)
}

/**
 * Default chain ID (Sepolia testnet)
 */
export const DEFAULT_CHAIN_ID = 11155111
