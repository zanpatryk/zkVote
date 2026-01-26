import { render, screen } from '@testing-library/react'
import TabWhitelist from './TabWhitelist'
import '@testing-library/jest-dom'

jest.mock('@/components/WhitelistManager', () => () => <div data-testid="whitelist-manager">WhitelistManager</div>)
jest.mock('@/components/WhitelistedAddressesList', () => () => <div data-testid="whitelist-list">WhitelistedAddressesList</div>)

describe('TabWhitelist', () => {
  it('renders all components', () => {
    render(<TabWhitelist pollId="123" pollState={1} />)
    
    expect(screen.getByText('Whitelist Management')).toBeInTheDocument()
    expect(screen.getByText('Control who is allowed to participate in this poll.')).toBeInTheDocument()
    expect(screen.getByTestId('whitelist-manager')).toBeInTheDocument()
    expect(screen.getByTestId('whitelist-list')).toBeInTheDocument()
  })
})
