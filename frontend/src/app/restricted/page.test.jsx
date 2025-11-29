import { render, screen } from '@testing-library/react'
import RestrictedPage from './page'
import '@testing-library/jest-dom'

describe('RestrictedPage', () => {
  it('renders restricted access message', () => {
    render(<RestrictedPage />)
    expect(screen.getByText('Restricted Access')).toBeInTheDocument()
    expect(screen.getByText(/You need to connect your wallet/)).toBeInTheDocument()
    expect(screen.getByText('Return to Landing Page')).toBeInTheDocument()
  })
})
