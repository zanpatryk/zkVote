import { render, screen, fireEvent } from '@testing-library/react'
import OptionsEditor from './OptionsEditor'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe('OptionsEditor', () => {
  const mockSetOptions = jest.fn()
  const defaultProps = {
    options: ['', ''],
    setOptions: mockSetOptions,
    isSecret: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial options', () => {
    render(<OptionsEditor {...defaultProps} options={['Option A', 'Option B']} />)
    expect(screen.getByDisplayValue('Option A')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Option B')).toBeInTheDocument()
  })

  it('calls setOptions on option change', () => {
    render(<OptionsEditor {...defaultProps} />)
    const input = screen.getByPlaceholderText('Option 1')
    fireEvent.change(input, { target: { value: 'New Val' } })
    expect(mockSetOptions).toHaveBeenCalledWith(['New Val', ''])
  })

  it('adds an option on add button click', () => {
    render(<OptionsEditor {...defaultProps} />)
    fireEvent.click(screen.getByText(/\+ Add Another Option/i))
    expect(mockSetOptions).toHaveBeenCalledWith(['', '', ''])
  })

  it('removes an option on delete button click', () => {
    render(<OptionsEditor {...defaultProps} options={['A', 'B', 'C']} />)
    const deleteBtns = screen.getAllByText('✕')
    fireEvent.click(deleteBtns[0])
    expect(mockSetOptions).toHaveBeenCalled()
    const filteredOptions = mockSetOptions.mock.calls[0][0]
    expect(filteredOptions).toEqual(['B', 'C'])
  })

  it('does not show delete button when only 2 options remain', () => {
    render(<OptionsEditor {...defaultProps} options={['A', 'B']} />)
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })

  it('disables add button when options limit reached (16) if isSecret is true', () => {
    const sixteenOptions = Array(16).fill('opt')
    render(<OptionsEditor {...defaultProps} options={sixteenOptions} isSecret={true} />)
    
    const addBtn = screen.getByText(/\+ Add Another Option/i)
    expect(addBtn).toBeDisabled()
    
    fireEvent.click(addBtn)
    expect(mockSetOptions).not.toHaveBeenCalled()
  })
})
