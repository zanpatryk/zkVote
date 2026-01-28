export class TransactionError extends Error {
  constructor(message, originalError = null) {
    super(message)
    this.name = 'TransactionError'
    this.originalError = originalError
  }
}

/**
 * Parses technical blockchain errors into user-friendly messages.
 * @param {Error} error - The caught error object (from viem/wagmi)
 * @param {string} fallbackMsg - Default message if no specific match is found
 * @returns {string} Human-readable error message
 */
export function formatTransactionError(error, fallbackMsg = 'Transaction failed') {
  const errorMessage = error?.message || ''
  
  // 1. User Rejected Request (MetaMask / Wallet)
  // Viem: UserRejectedRequestError, Code: 4001
  if (
    error?.name === 'UserRejectedRequestError' || 
    errorMessage.includes('User denied transaction signature') ||
    errorMessage.includes('rejected') ||
    error?.code === 4001
  ) {
    return 'Transaction cancelled by user'
  }

  // 2. Custom Error: Already Voted (0xaef0604b)
  // Check details and shortMessage as Viem puts revert reasons there often
  const fullErrorText = (errorMessage + (error?.details || '') + (error?.shortMessage || '')).toLowerCase()
  
  if (fullErrorText.includes('0xaef0604b') || fullErrorText.includes('already voted')) {
    return 'You have already cast a vote in this poll!'
  }

  // 3. Insufficient Funds
  if (
    error?.name === 'InsufficientFundsError' ||
    errorMessage.toLowerCase().includes('insufficient funds')
  ) {
    return 'Insufficient funds to complete transaction'
  }

  // 4. Paymaster Deposit Too Low (AA31)
  if (
    fullErrorText.includes('aa31') || 
    fullErrorText.includes('paymaster deposit too low')
  ) {
    return 'Voting failed: The poll has run out of sponsored gas funds. If you are the owner, please check the "Poll Funding" section in the Manage Poll page.'
  }


  // 4. Contract Logic Reverts (Generic)
  if (error?.shortMessage) {
    return error.shortMessage
  }

  // 5. Original Error Message (if available and not too technical)
  if (error?.message && !error.message.includes('JSON-RPC')) {
    return error.message
  }

  // 6. Fallback to generic message
  return fallbackMsg
}
