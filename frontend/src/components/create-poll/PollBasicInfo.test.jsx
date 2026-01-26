import { render, screen, fireEvent } from '@testing-library/react'
import PollBasicInfo from './PollBasicInfo'
import '@testing-library/jest-dom'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

describe('PollBasicInfo', () => {
  const mockSetTitle = jest.fn()
  const mockSetDescription = jest.fn()
  const defaultProps = {
    title: '',
    setTitle: mockSetTitle,
    description: '',
    setDescription: mockSetDescription,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders title and description inputs', () => {
    render(<PollBasicInfo {...defaultProps} />)
    expect(screen.getByText(/Poll Question/i)).toBeInTheDocument()
    expect(screen.getByText(/Description/i)).toBeInTheDocument()
  })

  it('calls setTitle on title change', () => {
    render(<PollBasicInfo {...defaultProps} />)
    const titleInput = screen.getByPlaceholderText(/e.g., Should we adopt the new governance proposal?/i)
    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    expect(mockSetTitle).toHaveBeenCalledWith('New Title')
  })

  it('calls setDescription on description change', () => {
    render(<PollBasicInfo {...defaultProps} />)
    const descInput = screen.getByPlaceholderText(/Provide context for voters.../i)
    fireEvent.change(descInput, { target: { value: 'New Description' } })
    expect(mockSetDescription).toHaveBeenCalledWith('New Description')
  })

  it('displays provided title and description', () => {
    render(<PollBasicInfo {...defaultProps} title="Existing Title" description="Existing Desc" />)
    expect(screen.getByDisplayValue('Existing Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Desc')).toBeInTheDocument()
  })
})
