
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import StatusFilter from './StatusFilter'

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

describe('StatusFilter', () => {
  const mockCallback = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with default status', () => {
    render(<StatusFilter currentStatus="all" onStatusChange={mockCallback} />)
    
    // Should show label for 'all'
    expect(screen.getByText('All Status')).toBeInTheDocument()
    
    // Dropdown content should not be visible initially
    expect(screen.queryByText('Created')).not.toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    render(<StatusFilter currentStatus="all" onStatusChange={mockCallback} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Dropdown options should appear
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Ended')).toBeInTheDocument()
  })

  it('calls onStatusChange and closes when option is selected', () => {
    render(<StatusFilter currentStatus="all" onStatusChange={mockCallback} />)

    // Open dropdown
    fireEvent.click(screen.getByRole('button'))

    // Click 'Active' option
    fireEvent.click(screen.getByText('Active'))

    expect(mockCallback).toHaveBeenCalledWith('1') // Value for Active
    
    expect(screen.queryByText('Created')).not.toBeInTheDocument()
  })

  it('highlights the selected option', () => {
    render(<StatusFilter currentStatus="1" onStatusChange={mockCallback} />)

    // Label should be Active
    expect(screen.getByText('Active')).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(screen.getAllByRole('button')[0]) // Use button role, or getByText('Active') parent if unambiguous

    expect(screen.getByText('✓')).toBeInTheDocument()
  })
  
  it('closes when clicking outside', async () => {
      render(
        <div>
            <div data-testid="outside">Outside</div>
            <StatusFilter currentStatus="all" onStatusChange={mockCallback} />
        </div>
      )
      
      // Open
      fireEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Created')).toBeInTheDocument()
      
      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'))
      
      // Should close
      expect(screen.queryByText('Created')).not.toBeInTheDocument()
  })
})
