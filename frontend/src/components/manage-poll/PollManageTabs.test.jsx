import { render, screen, fireEvent } from '@testing-library/react'
import PollManageTabs from './PollManageTabs'
import '@testing-library/jest-dom'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layoutId, ...props }) => <div {...props}>{children}</div>,
  },
}))

describe('PollManageTabs', () => {
  const mockSetActiveTab = jest.fn()
  it('renders standard poll tabs (no Registrations, no Results)', () => {
    // Default isZK=false
    render(<PollManageTabs activeTab="details" setActiveTab={mockSetActiveTab} isZK={false} isSecret={false} />)
    
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Whitelisting')).toBeInTheDocument()
    expect(screen.getByText('Votes')).toBeInTheDocument()
    
    expect(screen.queryByText('Results')).not.toBeInTheDocument()
    expect(screen.queryByText('Registrations')).not.toBeInTheDocument()
  })

  it('renders ZK poll tabs (includes Registrations and Results if secret)', () => {
    // isZK=true, isSecret=true
    render(<PollManageTabs activeTab="details" setActiveTab={mockSetActiveTab} isZK={true} isSecret={true} />)
    
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Whitelisting')).toBeInTheDocument()
    expect(screen.getByText('Registrations')).toBeInTheDocument()
    expect(screen.getByText('Votes')).toBeInTheDocument()
    expect(screen.getByText('Results')).toBeInTheDocument()
  })

  it('highlights the active tab', () => {
    render(<PollManageTabs activeTab="details" setActiveTab={mockSetActiveTab} />)
    
    const activeTab = screen.getByText('Details')
    expect(activeTab).toHaveClass('text-black')
    
    const inactiveTab = screen.getByText('Whitelisting')
    expect(inactiveTab).toHaveClass('text-gray-500')
  })

  it('calls setActiveTab when a tab is clicked', () => {
    render(<PollManageTabs activeTab="details" setActiveTab={mockSetActiveTab} />)
    
    fireEvent.click(screen.getByText('Whitelisting'))
    expect(mockSetActiveTab).toHaveBeenCalledWith('whitelist')
    
    fireEvent.click(screen.getByText('Votes'))
    expect(mockSetActiveTab).toHaveBeenCalledWith('votes')
  })
})
