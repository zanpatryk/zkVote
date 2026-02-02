import { render, screen } from '@testing-library/react'
import TabRegistration from './TabRegistration'
import '@testing-library/jest-dom'

jest.mock('@/components/RegistrationList', () => () => <div data-testid="registration-list">RegistrationList</div>)

describe('TabRegistration', () => {
  it('renders all components', () => {
    render(<TabRegistration pollId="123" pollState={1} />)
    
    expect(screen.getByText('Registration Registry')).toBeInTheDocument()
    expect(screen.getByText('Verified ZK Identity Commitments.')).toBeInTheDocument()
    expect(screen.getByTestId('registration-list')).toBeInTheDocument()
  })
})
