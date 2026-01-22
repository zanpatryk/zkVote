import { render, screen } from '@testing-library/react'
import TabResults from './TabResults'
import '@testing-library/jest-dom'

jest.mock('@/components/TallyManager', () => () => <div data-testid="tally-manager">TallyManager</div>)

describe('TabResults', () => {
  it('renders all components', () => {
    render(<TabResults pollId="123" pollState={2} />)
    
    expect(screen.getByText('Tally & Results')).toBeInTheDocument()
    expect(screen.getByText('Decrypt and publish final election results.')).toBeInTheDocument()
    expect(screen.getByTestId('tally-manager')).toBeInTheDocument()
  })
})
