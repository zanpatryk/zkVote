import { render, screen } from '@testing-library/react'
import StatsBanner from './StatsBanner'

describe('StatsBanner', () => {
  it('renders marquee stats', () => {
    render(<StatsBanner />)
    expect(screen.getAllByText('ZERO KNOWLEDGE PROTOCOLS')[0]).toBeInTheDocument()
    expect(screen.getAllByText('HOMOMORPHIC ENCRYPTION')[0]).toBeInTheDocument()
    expect(screen.getAllByText('SEMAPHORE V4')[0]).toBeInTheDocument()
    expect(screen.getAllByText('ON-CHAIN VERIFICATION')[0]).toBeInTheDocument()
  })
})
