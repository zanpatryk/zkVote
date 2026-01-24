import { render, screen } from '@testing-library/react'
import GlobalError from './error'

jest.mock('@/components/ErrorFallback', () => ({ error, reset, title, description }) => (
  <div data-testid="error-fallback">
    <h1>{title}</h1>
    <p>{description}</p>
    {error && <span data-testid="error-message">{error.message}</span>}
    {reset && <button onClick={reset}>Reset</button>}
  </div>
))

describe('GlobalError', () => {
  it('renders ErrorFallback with correct props', () => {
    const error = new Error('Test error')
    const reset = jest.fn()

    render(<GlobalError error={error} reset={reset} />)

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument()
    expect(screen.getByText('Application Error')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred in zkVote/)).toBeInTheDocument()
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test error')
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('passes reset function to ErrorFallback', () => {
    const reset = jest.fn()
    render(<GlobalError error={new Error('Test')} reset={reset} />)

    screen.getByRole('button', { name: /reset/i }).click()
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
