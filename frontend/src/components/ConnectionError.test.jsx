import { render, screen, fireEvent } from '@testing-library/react'
import ConnectionError from './ConnectionError'

describe('ConnectionError', () => {
  it('renders null when no error is provided', () => {
    const { container } = render(<ConnectionError />)
    expect(container.firstChild).toBeNull()
  })

  it('renders generic error message correctly', () => {
    const errorMsg = 'Something went wrong'
    render(<ConnectionError error={errorMsg} />)
    
    expect(screen.getByText(errorMsg)).toBeInTheDocument()
    expect(screen.queryByText('Connection Error')).not.toBeInTheDocument()
  })

  it('renders network error message specifically', () => {
    const errorMsg = 'A network error occurred'
    render(<ConnectionError error={errorMsg} />)
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument()
    expect(screen.getByText(/Could not connect to the network/i)).toBeInTheDocument()
  })

  it('calls onRetry when provided and button is clicked', () => {
    const onRetry = jest.fn()
    render(<ConnectionError error="Error" onRetry={onRetry} />)
    
    fireEvent.click(screen.getByText('Try Again'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
