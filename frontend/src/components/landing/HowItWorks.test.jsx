import { render, screen } from '@testing-library/react'
import HowItWorks from './HowItWorks'

describe('HowItWorks', () => {
  it('renders all 5 technical steps', () => {
    render(<HowItWorks />)
    expect(screen.getByText('How It Works')).toBeInTheDocument()
    
    expect(screen.getByText('Zero-Knowledge Membership')).toBeInTheDocument()
    expect(screen.getByText('ElGamal Homomorphic Encryption')).toBeInTheDocument()
    expect(screen.getByText('Cryptographic Nullifiers')).toBeInTheDocument()
    expect(screen.getByText('Proof of Tally')).toBeInTheDocument()
    expect(screen.getByText('Native On-Chain Execution')).toBeInTheDocument()
  })
})
