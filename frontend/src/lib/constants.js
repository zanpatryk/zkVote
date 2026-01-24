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
 * Default chain ID (Anvil local node)
 */
export const DEFAULT_CHAIN_ID = 31337

/**
 * Configuration: Use local ZKVote circuits (ElGamal) instead of CDN
 * Default: false (uses NEXT_PUBLIC_CDN_URL if provided)
 */
export const USE_LOCAL_ZKVOTE_CIRCUITS = false

/**
 * Base URL for circuit artifacts (CDN or local)
 * Respects USE_LOCAL_ZKVOTE_CIRCUITS toggle
 */
const BASE_URL = USE_LOCAL_ZKVOTE_CIRCUITS ? '' : (process.env.NEXT_PUBLIC_CDN_URL || '')

/**
 * Circuit paths for ElGamal tally decryption proof generation
 */
export const TALLY_CIRCUIT_WASM_PATH = `${BASE_URL}/circuits/elGamalTallyDecrypt_N16/elGamalTallyDecrypt_N16.wasm`
export const TALLY_CIRCUIT_ZKEY_PATH = `${BASE_URL}/circuits/elGamalTallyDecrypt_N16/elGamalTallyDecrypt_N16_final.zkey`

/**
 * Circuit paths for ElGamal vote vector encryption proof generation
 */
export const VOTE_CIRCUIT_WASM_PATH = `${BASE_URL}/circuits/elgamalVoteVector_N16/elGamalVoteVector_N16.wasm`
export const VOTE_CIRCUIT_ZKEY_PATH = `${BASE_URL}/circuits/elgamalVoteVector_N16/elGamalVoteVector_N16_final.zkey`

/**
 * Semaphore circuit paths (optional local usage)
 * {depth} will be replaced by the tree depth
 */
export const SEMAPHORE_CIRCUIT_WASM_PATH_TEMPLATE = `${BASE_URL}/semaphore/{depth}/semaphore.wasm`
export const SEMAPHORE_CIRCUIT_ZKEY_PATH_TEMPLATE = `${BASE_URL}/semaphore/{depth}/semaphore.zkey`

/**
 * Configuration: Use local Semaphore circuits instead of CDN
 * Default: false (uses trusted-setup-pse.org CDN)
 */
export const USE_LOCAL_SEMAPHORE_CIRCUITS = false
