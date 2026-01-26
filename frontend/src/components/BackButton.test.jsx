import { render, screen, fireEvent } from '@testing-library/react'
import BackButton from './BackButton'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Link since it handles client-side navigation
jest.mock('next/link', () => {
    return ({ children, href }) => {
      return <a href={href}>{children}</a>
    }
})

describe('BackButton', () => {
  const mockBack = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useRouter.mockReturnValue({ back: mockBack })
  })

  it('renders with default props (Arrow variant, "Go Back", history back)', () => {
    render(<BackButton />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('← Go Back')
    
    fireEvent.click(button)
    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('renders with custom label', () => {
    render(<BackButton label="Return Home" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('← Return Home')
  })

  it('renders bracket variant', () => {
    render(<BackButton variant="bracket" label="Cancel" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('[ Cancel ]')
  })

  it('renders as a link when href is provided', () => {
    render(<BackButton href="/dashboard" />)
    
    // Should be wrapped in an anchor tag due to our Link mock
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard')
    
    // The button should still be inside
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    
    // Clicking shouldn't trigger router.back() because it's a link now
    fireEvent.click(button)
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<BackButton className="text-red-500 custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-red-500')
    expect(button).toHaveClass('custom-class')
    expect(button).toHaveClass('text-gray-600') // Base class should still exist
  })
})
