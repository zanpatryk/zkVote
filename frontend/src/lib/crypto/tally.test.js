import { elgamal, proof as proofUtils } from '@zkvote/lib'
import * as snarkjs from 'snarkjs'
import { decryptTally, generateTallyProof, decryptAndProveTally } from './tally'
import { ELGAMAL_VECTOR_SIZE } from '@/lib/constants'

jest.mock('@zkvote/lib', () => ({
  elgamal: {
    init: jest.fn(),
    decryptScalar: jest.fn(),
    getPublicKey: jest.fn(),
  },
  proof: {
    formatProofForSolidity: jest.fn(),
  },
}))

jest.mock('snarkjs', () => ({
  groth16: {
    fullProve: jest.fn(),
  },
}))

describe('tally crypto utils', () => {
  const mockSecretKey = '123'
  const mockCiphertexts = [
    Array(ELGAMAL_VECTOR_SIZE).fill(['1', '2']), // C1
    Array(ELGAMAL_VECTOR_SIZE).fill(['3', '4']), // C2
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    elgamal.init.mockResolvedValue()
    elgamal.decryptScalar.mockReturnValue(5n) // Always decrypts to 5
    elgamal.getPublicKey.mockReturnValue([10n, 20n]) // Mock PK
    snarkjs.groth16.fullProve.mockResolvedValue({ proof: { pi_a: [] } })
    proofUtils.formatProofForSolidity.mockReturnValue({ pA: [] })
  })

  describe('decryptTally', () => {
    it('initializes and decrypts each option', async () => {
      const result = await decryptTally(mockCiphertexts, mockSecretKey)

      expect(elgamal.init).toHaveBeenCalled()
      expect(elgamal.decryptScalar).toHaveBeenCalledTimes(ELGAMAL_VECTOR_SIZE)
      expect(result.tally).toEqual(Array(ELGAMAL_VECTOR_SIZE).fill(5n))
      expect(result.publicKey).toEqual([10n, 20n])
      expect(result.ciphertexts.c1[0]).toEqual([1n, 2n])
    })

    it('throws error if decryption returns -1', async () => {
      elgamal.decryptScalar.mockReturnValue(-1)
      await expect(decryptTally(mockCiphertexts, mockSecretKey)).rejects.toThrow(/Decryption failed for option 0/)
    })
  })

  describe('generateTallyProof', () => {
    it('calls snarkjs and formats proof', async () => {
      const mockTally = [1n, 2n]
      const mockPk = [10n, 20n]
      const mockCts = { c1: [[1n, 2n]], c2: [[3n, 4n]] }

      const result = await generateTallyProof(mockTally, mockPk, mockCts, mockSecretKey)

      expect(snarkjs.groth16.fullProve).toHaveBeenCalled()
      expect(proofUtils.formatProofForSolidity).toHaveBeenCalled()
      expect(result).toEqual({ pA: [] })
    })
  })

  describe('decryptAndProveTally', () => {
    it('executes full pipeline', async () => {
      const result = await decryptAndProveTally(mockCiphertexts, mockSecretKey)

      expect(elgamal.init).toHaveBeenCalled()
      expect(snarkjs.groth16.fullProve).toHaveBeenCalled()
      expect(result.tally).toEqual(Array(ELGAMAL_VECTOR_SIZE).fill(5n))
      expect(result.proof).toEqual({ pA: [] })
    })
  })
})
