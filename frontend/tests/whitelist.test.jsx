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

jest.mock('@/components/WhitelistedAddressesList', () => ({
  __esModule: true,
  default: () => <div data-testid="whitelisted-addresses-list">Mocked List</div>,
}))

jest.mock('@/lib/blockchain/engine/read', () => ({
  getPollById: jest.fn().mockResolvedValue({ state: 0 }),
}))

jest.mock('@/hooks/usePolls', () => ({
  usePoll: jest.fn().mockReturnValue({ 
    poll: { state: 0 }, 
    isLoading: false, 
    error: null 
  }),
}))

jest.mock('@/hooks/useWhitelistedAddresses', () => ({
  useWhitelistedAddresses: jest.fn().mockReturnValue({
    addresses: new Set(),
    loading: false,
    hasMore: false,
    loadMore: jest.fn(),
    lastScannedBlock: 0n,
    addToWhitelist: jest.fn(),
  }),
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

  it('renders the page title', async () => {
    render(<WhitelistPage />)
    await waitFor(() => {
      expect(screen.getByText('Whitelist Voters')).toBeInTheDocument()
    })
  })

  it('renders the WhitelistManager with correct pollId', async () => {
    render(<WhitelistPage />)
    await waitFor(() => {
      expect(screen.getByTestId('whitelist-manager')).toHaveTextContent('Mocked WhitelistManager for poll 123')
    })
  })
})
