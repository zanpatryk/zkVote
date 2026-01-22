import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ManagePollPage from '../src/app/poll/[pollId]/manage/page'
import '@testing-library/jest-dom'
import { toast } from 'react-hot-toast'

// Mock dependencies
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ pollId: '123' }),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  http: jest.fn(),
}))

// Mock getModules
const mockGetPollById = jest.fn()
const mockGetMerkleTreeDepth = jest.fn()
const mockGetModules = jest.fn()

jest.mock('../src/lib/blockchain/engine/read', () => ({
  getPollById: (...args) => mockGetPollById(...args),
  getMerkleTreeDepth: (...args) => mockGetMerkleTreeDepth(...args),
  getModules: (...args) => mockGetModules(...args),
}))

// Mock CONTRACTS
jest.mock('../src/lib/contracts', () => ({
    CONTRACT_ADDRESSES: {
        zkElGamalVoteVector: '0xZKStorage',
        voteStorageV0: '0xStandardStorage',
        semaphoreEligibility: '0xSemaphoreEligibility'
    }
}))

// Mock sub-components/tabs
jest.mock('../src/components/manage-poll/TabDetails', () => () => <div data-testid="tab-details">Details Content</div>)
jest.mock('../src/components/manage-poll/TabWhitelist', () => () => <div data-testid="tab-whitelist">Whitelist Content</div>)
jest.mock('../src/components/manage-poll/TabRegistration', () => () => <div data-testid="tab-registration">Registration Content</div>)
jest.mock('../src/components/manage-poll/TabVotes', () => () => <div data-testid="tab-votes">Votes Content</div>)

jest.mock('../src/components/manage-poll/TabResults', () => ({ isSecret }) => (
    <div data-testid="tab-results">Results: {isSecret ? 'Secret' : 'Public'}</div>
))

describe('Integration Test: Manage Poll Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAccount.mockReturnValue({ isConnected: true, address: '0xOwner' })
    mockGetModules.mockResolvedValue({ voteStorage: '0xStandardStorage' })
  })

  // Removed "determines if poll is secret... Switch to Results" test because Results is hidden if not secret.

  it('identifies secret poll correctly', async () => {
    mockGetPollById.mockResolvedValue({
      creator: '0xOwner',
      state: 1
    })
    mockGetMerkleTreeDepth.mockResolvedValue(20)
    mockGetModules.mockResolvedValue({ voteStorage: '0xZKStorage', eligibilityModule: '0xSemaphoreEligibility' })
    
    // 0xZKStorage matches CONTRACT_ADDRESSES.zkElGamalVoteVector
    // 0xSemaphoreEligibility matches CONTRACT_ADDRESSES.semaphoreEligibility

    render(<ManagePollPage />)

    await waitFor(() => expect(screen.getByText('Manage Poll')).toBeInTheDocument())
    
    // Switch to Results (Visible)
    fireEvent.click(screen.getByText('Results'))
    
    // Should be Secret
    expect(screen.getByText('Results: Secret')).toBeInTheDocument()
  })


  it('redirects if user is not owner', async () => {
    mockGetPollById.mockResolvedValue({
      creator: '0xSomeoneElse',
      state: 0
    })
    
    render(<ManagePollPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('You are not the owner of this poll.')).toBeInTheDocument()
    })
  })

  it('renders standard poll tabs (No ZK, No Results)', async () => {
    mockGetPollById.mockResolvedValue({
      creator: '0xOwner',
      state: 1
    })
    mockGetMerkleTreeDepth.mockResolvedValue(0)
    mockGetModules.mockResolvedValue({ voteStorage: '0xStandardStorage', eligibilityModule: '0xStandardEligibility' })
    
    render(<ManagePollPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Manage Poll')).toBeInTheDocument()
    })

    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Whitelisting')).toBeInTheDocument()
    expect(screen.getByText('Votes')).toBeInTheDocument()
    
    // Results IS HIDDEN for standard
    expect(screen.queryByText('Results')).not.toBeInTheDocument()
    
    // Registrations NOT present for non-ZK
    expect(screen.queryByText('Registrations')).not.toBeInTheDocument()
    
    expect(screen.getByTestId('tab-details')).toBeInTheDocument()
  })

  it('switches tabs correctly', async () => {
    mockGetPollById.mockResolvedValue({
      creator: '0xOwner',
      state: 1
    })
    
    render(<ManagePollPage />)
    
    await waitFor(() => expect(screen.getByTestId('tab-details')).toBeInTheDocument())
    
    // Switch to Whitelisting
    fireEvent.click(screen.getByText('Whitelisting'))
    expect(screen.getByTestId('tab-whitelist')).toBeInTheDocument()
    expect(screen.queryByTestId('tab-details')).not.toBeInTheDocument()
    
    // Switch to Votes
    fireEvent.click(screen.getByText('Votes'))
    expect(screen.getByTestId('tab-votes')).toBeInTheDocument()
  })

  it('renders registration tab content for ZK poll', async () => {
    mockGetPollById.mockResolvedValue({
      creator: '0xOwner',
      state: 1
    })
    mockGetMerkleTreeDepth.mockResolvedValue(20)
    mockGetModules.mockResolvedValue({ voteStorage: '0xZKStorage', eligibilityModule: '0xSemaphoreEligibility' })
    
    render(<ManagePollPage />)
    
    await waitFor(() => expect(screen.getByTestId('tab-details')).toBeInTheDocument())
    
    // Switch to Registrations
    fireEvent.click(screen.getByText('Registrations'))
    expect(screen.getByTestId('tab-registration')).toBeInTheDocument()
  })
})
