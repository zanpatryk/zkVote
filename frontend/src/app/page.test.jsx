import { render, screen } from '@testing-library/react'
import LandingPage from './page'
import '@testing-library/jest-dom'

describe('LandingPage', () => {
  it('renders the landing page content', () => {
    render(<LandingPage />)
    expect(screen.getByText('zkVote')).toBeInTheDocument()
    expect(screen.getByText('Decentralized Voting System')).toBeInTheDocument()
  })
})
