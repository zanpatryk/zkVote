import { render, screen } from '@testing-library/react'
import NotFound from './not-found'
import '@testing-library/jest-dom'

jest.mock('framer-motion', () => ({
  motion: { div: 'div' },
}))

describe('NotFound', () => {
  it('renders the 404 content', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
    expect(screen.getByText('The page you are looking for does not exist or has been moved.')).toBeInTheDocument()
    expect(screen.getByText('Return to Landing Page')).toBeInTheDocument()
  })
})
