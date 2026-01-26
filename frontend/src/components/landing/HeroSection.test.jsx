import { render, screen, fireEvent } from '@testing-library/react'
import HeroSection from './HeroSection'

describe('HeroSection', () => {
  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
    }))
  })

  it('renders badge and description', () => {
    render(<HeroSection />)
    expect(screen.getByText('Zero Knowledge Protocol')).toBeInTheDocument()
    expect(screen.getByText(/Proving your right to vote/i)).toBeInTheDocument()
    expect(screen.getByText(/Mathematical privacy/i)).toBeInTheDocument()
  })

  it('renders the main headline', () => {
    render(<HeroSection />)
    expect(screen.getByText(/VOTE/)).toBeInTheDocument()
    expect(screen.getByText(/TRACE/)).toBeInTheDocument()
  })

  it('renders the canvas element for background animation', () => {
    const { container } = render(<HeroSection />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('handles mouse move events on the container', () => {
    const { container } = render(<HeroSection />)
    // Get the outermost element that has the onMouseMove handler
    const wrapperDiv = container.firstChild
    
    // The component should handle mouse move events without errors
    if (wrapperDiv) {
      fireEvent.mouseMove(wrapperDiv, { clientX: 100, clientY: 200 })
    }
    // No error means the handler works
  })
})
