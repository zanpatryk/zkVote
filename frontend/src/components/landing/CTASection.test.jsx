
import { render, screen } from '@testing-library/react'
import CTASection from './CTASection'

describe('CTASection', () => {
  it('renders CTA title and connect message', () => {
    render(<CTASection />)
    expect(screen.getByText('Ready to Vote?')).toBeInTheDocument()
    expect(screen.getByText(/Connect Wallet Above/i)).toBeInTheDocument()
  })
})
