import { render, screen } from '@testing-library/react'
import RootLayout from './layout'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/components/Navbar', () => () => <div data-testid="navbar">Navbar</div>)
jest.mock('@/components/Footer', () => () => <div data-testid="footer">Footer</div>)
jest.mock('@/lib/providers/Providers', () => ({ children }) => <div data-testid="providers">{children}</div>)

describe('RootLayout', () => {
  it('renders the layout structure', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Child Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('providers')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })
})
