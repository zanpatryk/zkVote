import { elgamal, proof as proofUtils } from '@zkvote/lib'
import * as snarkjs from 'snarkjs'
import { ELGAMAL_VECTOR_SIZE } from '@/lib/constants'

/**
 * Decrypts aggregated ElGamal ciphertexts and generates a ZK proof of correct decryption.
 * 
 * @param {Array} ciphertexts - Tuple of [aggC1, aggC2] from contract
 * @param {string|bigint} secretKey - The poll's secret key
 * @returns {Promise<{tally: bigint[], proof: object, publicKey: bigint[]}>}
 */
export async function decryptTally(ciphertexts, secretKey) {
  await elgamal.init()
  
  const sk = BigInt(secretKey)
  const [aggC1, aggC2] = ciphertexts
  
  // Convert to BigInt format
  const bigIntC1 = aggC1.map(p => [BigInt(p[0]), BigInt(p[1])])
  const bigIntC2 = aggC2.map(p => [BigInt(p[0]), BigInt(p[1])])
  
  // Decrypt each option
  const tally = []
  for (let i = 0; i < ELGAMAL_VECTOR_SIZE; i++) {
    const ct = { c1: bigIntC1[i], c2: bigIntC2[i] }
    const m = elgamal.decryptScalar(sk, ct)
    
    if (m === -1) {
      throw new Error(`Decryption failed for option ${i}. Wrong Secret Key?`)
    }
    tally.push(m)
  }
  
  // Derive public key from secret key
  const publicKey = elgamal.getPublicKey(sk)
  
  return { 
    tally, 
    publicKey, 
    ciphertexts: { c1: bigIntC1, c2: bigIntC2 } 
  }
}

/**
 * Generates a ZK proof of correct tally decryption.
 * 
 * @param {bigint[]} tally - Decrypted vote counts
 * @param {bigint[]} publicKey - Poll public key [x, y]
 * @param {{c1: bigint[][], c2: bigint[][]}} ciphertexts - Aggregated ciphertexts
 * @param {string|bigint} secretKey - Poll secret key
 * @returns {Promise<object>} Formatted proof for Solidity
 */
export async function generateTallyProof(tally, publicKey, ciphertexts, secretKey) {
  const sk = BigInt(secretKey)
  
  const input = {
    pk: [publicKey[0], publicKey[1]],
    aggC1: ciphertexts.c1,
    aggC2: ciphertexts.c2,
    tally,
    sk
  }
  
  const wasmPath = `/circuits/elGamalTallyDecrypt_N16/elGamalTallyDecrypt_N16.wasm`
  const zkeyPath = `/circuits/elGamalTallyDecrypt_N16/elGamalTallyDecrypt_N16_final.zkey`
  
  const { proof } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath)
  
  return proofUtils.formatProofForSolidity(proof)
}

/**
 * Full pipeline: decrypt tally and generate proof.
 * 
 * @param {Array} ciphertexts - Tuple of [aggC1, aggC2] from contract  
 * @param {string|bigint} secretKey - The poll's secret key
 * @returns {Promise<{tally: bigint[], proof: object}>}
 */
export async function decryptAndProveTally(ciphertexts, secretKey) {
  const { tally, publicKey, ciphertexts: formattedCts } = await decryptTally(ciphertexts, secretKey)
  const proof = await generateTallyProof(tally, publicKey, formattedCts, secretKey)
  
  return { tally, proof }
}
