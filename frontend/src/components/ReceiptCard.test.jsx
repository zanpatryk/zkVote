import { render, screen } from '@testing-library/react'
import ReceiptCard from './ReceiptCard'

describe('ReceiptCard', () => {
  const defaultProps = {
    pollId: '12345',
    voteId: '67890',
  }

  it('renders correctly with required props', () => {
    render(<ReceiptCard {...defaultProps} />)
    expect(screen.getByText('zkVote')).toBeInTheDocument()
    expect(screen.getByText('Vote Receipt')).toBeInTheDocument()
    
    // Check Poll ID Link
    const pollLink = screen.getByRole('link', { name: '12345' })
    expect(pollLink).toBeInTheDocument()
    expect(pollLink).toHaveAttribute('href', '/poll/12345')

    expect(screen.getByText('67890')).toBeInTheDocument()
    expect(screen.queryByText('Transaction Hash')).not.toBeInTheDocument()
  })

  it('renders txHash when provided', () => {
    render(<ReceiptCard {...defaultProps} txHash="0xabc123" />)
    expect(screen.getByText('Transaction Hash')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: "0xabc123" })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://sepolia.etherscan.io/tx/0xabc123')
  })
})
