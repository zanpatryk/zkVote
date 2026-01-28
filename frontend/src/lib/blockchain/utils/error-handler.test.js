import { formatTransactionError, TransactionError } from './error-handler'
import { toast } from 'react-hot-toast'

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn()
  }
}))

describe('blockchain error-handler', () => {
  describe('TransactionError', () => {
    it('sets message and original error', () => {
      const original = new Error('raw error')
      const err = new TransactionError('friendly msg', original)
      expect(err.message).toBe('friendly msg')
      expect(err.name).toBe('TransactionError')
      expect(err.originalError).toBe(original)
    })
  })

  describe('formatTransactionError', () => {
    it('handles user rejection', () => {
      expect(formatTransactionError({ name: 'UserRejectedRequestError' })).toBe('Transaction cancelled by user')
      expect(formatTransactionError({ message: 'User denied transaction signature' })).toBe('Transaction cancelled by user')
      expect(formatTransactionError({ message: 'request rejected' })).toBe('Transaction cancelled by user')
      expect(formatTransactionError({ code: 4001 })).toBe('Transaction cancelled by user')
    })

    it('handles already voted error (0xaef0604b)', () => {
      expect(formatTransactionError({ message: 'execution reverted: 0xaef0604b' })).toBe('You have already cast a vote in this poll!')
    })

    it('handles already voted error (0xaef0604b) in details', () => {
      expect(formatTransactionError({ message: 'execution reverted', details: '... custom error 0xaef0604b ...' })).toBe('You have already cast a vote in this poll!')
    })

    it('handles insufficient funds', () => {
      expect(formatTransactionError({ name: 'InsufficientFundsError' })).toBe('Insufficient funds to complete transaction')
      expect(formatTransactionError({ message: 'insufficient funds for gas' })).toBe('Insufficient funds to complete transaction')
    })

    it('handles AA31 paymaster deposit too low', () => {
      const errorMsg = 'FailedOp(uint256 opIndex, string reason) (0, AA31 paymaster deposit too low)'
      const expected = 'Voting failed: The poll has run out of sponsored gas funds. If you are the owner, please check the "Poll Funding" section in the Manage Poll page.'
      expect(formatTransactionError({ message: errorMsg })).toBe(expected)
      
      const errorInDetails = { message: 'Contract revert', details: 'AA31 paymaster deposit too low' }
      expect(formatTransactionError(errorInDetails)).toBe(expected)
    })


    it('returns shortMessage if available', () => {
      expect(formatTransactionError({ shortMessage: 'Viem short message' })).toBe('Viem short message')
    })

    it('returns original message if not too technical', () => {
      expect(formatTransactionError({ message: 'Normal error' })).toBe('Normal error')
    })

    it('falls back to default message for technical RPC errors', () => {
      expect(formatTransactionError({ message: 'Internal JSON-RPC error' }, 'Failed badly')).toBe('Failed badly')
    })

    it('handles null/undefined error', () => {
      expect(formatTransactionError(null)).toBe('Transaction failed')
    })
  })
})
