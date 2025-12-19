import { render, screen, waitFor } from '@testing-library/react'
import WhitelistPage from '../src/app/poll/[pollId]/whitelist/page'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('@/components/WhitelistManager', () => ({
  __esModule: true,
  default: ({ pollId, onSuccess }) => (
    <div data-testid="whitelist-manager">
      Mocked WhitelistManager for poll {pollId}
    </div>
  ),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({
    pollId: '123',
  }),
}))

describe('WhitelistPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the page title', () => {
    render(<WhitelistPage />)
    expect(screen.getByText('Whitelist Voters')).toBeInTheDocument()
  })

  it('renders the WhitelistManager with correct pollId', () => {
    render(<WhitelistPage />)
    expect(screen.getByTestId('whitelist-manager')).toHaveTextContent('Mocked WhitelistManager for poll 123')
  })
})
