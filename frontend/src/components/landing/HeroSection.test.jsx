
import { render, screen } from '@testing-library/react'
import HeroSection from './HeroSection'

describe('HeroSection', () => {
  if (typeof window !== 'undefined') {
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
  }

  it('renders badge and description', () => {
    render(<HeroSection />)
    expect(screen.getByText('Zero Knowledge Protocol')).toBeInTheDocument()
    // Description appears after animation or is in DOM?
    // It has `animate={{ opacity: complete ? 1 : 0 }}`.
    // So initially invisible? toBeInTheDocument() checks presence in DOM, opacity doesn't remove it unless conditional rendering.
    // It is rendered: <motion.p ... > ... </motion.p>
    // So it should be in document, just invisible.
    expect(screen.getByText(/Proving your right to vote/i)).toBeInTheDocument()
    expect(screen.getByText(/Mathematical privacy/i)).toBeInTheDocument()
  })
})
