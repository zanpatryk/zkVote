
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExperienceShowcase from './ExperienceShowcase'

// Mock sub-components
jest.mock('@/components/PollCard', () => ({ interactive }) => (
  <div data-testid="poll-card" data-interactive={String(interactive)}>Poll Card</div>
))
jest.mock('@/components/VoteBallot', () => () => <div data-testid="vote-ballot">Vote Ballot</div>)
jest.mock('@/components/ReceiptCard', () => () => <div data-testid="receipt-card">Receipt Card</div>)
jest.mock('@/components/NFTCard', () => ({ initialExpanded, interactive }) => (
  <div data-testid="nft-card" data-expanded={String(initialExpanded)} data-interactive={String(interactive)}>NFT Card</div>
))

// Mock new components used in the journeys
jest.mock('@/components/create-poll/PollBasicInfo', () => () => <div data-testid="poll-basic-info">Poll Basic Info</div>)
jest.mock('@/components/create-poll/PollSettings', () => () => <div data-testid="poll-settings">Poll Settings</div>)
jest.mock('@/components/create-poll/OptionsEditor', () => () => <div data-testid="options-editor">Options Editor</div>)
jest.mock('@/components/WhitelistManager', () => ({ demo }) => <div data-testid="whitelist-manager" data-demo={String(demo)}>Whitelist Manager</div>)
jest.mock('@/components/TallyManager', () => ({ demo }) => <div data-testid="tally-manager" data-demo={String(demo)}>Tally Manager</div>)
jest.mock('@/components/register-poll/RegistrationInstructions', () => ({ demo }) => <div data-testid="registration-instructions" data-demo={String(demo)}>Registration Instructions</div>)

describe('ExperienceShowcase', () => {
  it('renders default Poll Creator journey correctly', () => {
    render(<ExperienceShowcase />)
    
    expect(screen.getByText('Experience the Platform')).toBeInTheDocument()
    
    // Check for Creator Tab Content
    expect(screen.getByText('Create Your Poll')).toBeInTheDocument()
    expect(screen.getByText('Whitelist Eligible Voters')).toBeInTheDocument()
    expect(screen.getByText('Monitor Live Voting')).toBeInTheDocument()
    expect(screen.getByText('Decrypt & Publish Results')).toBeInTheDocument()
    
    // Verify Creator Components
    expect(screen.getByTestId('poll-basic-info')).toBeInTheDocument()
    expect(screen.getByTestId('poll-settings')).toBeInTheDocument()
    expect(screen.getByTestId('whitelist-manager')).toBeInTheDocument()
    expect(screen.getByTestId('whitelist-manager')).toHaveAttribute('data-demo', 'true')
    expect(screen.getByTestId('tally-manager')).toBeInTheDocument()
    expect(screen.getByTestId('tally-manager')).toHaveAttribute('data-demo', 'true')
  })

  it('switches to Voter journey when tab is clicked', async () => {
    render(<ExperienceShowcase />)
    
    // Click Voter Tab
    const voterTab = screen.getByText('I Want to Vote')
    fireEvent.click(voterTab)
    
    // Wait for transition
    await waitFor(() => {
        expect(screen.getByText('Browse Available Polls')).toBeInTheDocument()
    })
    
    // Check for Voter Tab Content
    expect(screen.getByText('Register Your ZK Identity')).toBeInTheDocument()
    expect(screen.getByText('Cast Your Encrypted Vote')).toBeInTheDocument()
    expect(screen.getByText('Verify Your Vote')).toBeInTheDocument()
    expect(screen.getByText('Collect NFT Badge')).toBeInTheDocument()
    
    // Verify Voter Components
    expect(screen.getByTestId('poll-card')).toBeInTheDocument()
    expect(screen.getByTestId('registration-instructions')).toBeInTheDocument()
    expect(screen.getByTestId('registration-instructions')).toHaveAttribute('data-demo', 'true')
    expect(screen.getByTestId('vote-ballot')).toBeInTheDocument()
    expect(screen.getByTestId('receipt-card')).toBeInTheDocument()
    
    // Verify NFTCard is unrolled and interactive
    const nftCard = screen.getByTestId('nft-card')
    expect(nftCard).toBeInTheDocument()
    expect(nftCard).toHaveAttribute('data-expanded', 'true')
    expect(nftCard).toHaveAttribute('data-interactive', 'true')
  })

  it('switches back to Creator journey when tab is clicked', async () => {
    render(<ExperienceShowcase />)
    
    // First switch to Voter
    fireEvent.click(screen.getByText('I Want to Vote'))
    await waitFor(() => {
      expect(screen.getByText('Browse Available Polls')).toBeInTheDocument()
    })
    
    // Then switch back to Creator
    fireEvent.click(screen.getByText('I Want to Create a Poll'))
    await waitFor(() => {
      expect(screen.getByText('Create Your Poll')).toBeInTheDocument()
    })
  })

  it('renders both tab buttons', () => {
    render(<ExperienceShowcase />)
    
    expect(screen.getByText('I Want to Create a Poll')).toBeInTheDocument()
    expect(screen.getByText('I Want to Vote')).toBeInTheDocument()
  })

  it('renders journey step descriptions', () => {
    render(<ExperienceShowcase />)
    
    // Check step descriptions visible on the creator journey
    expect(screen.getByText(/Set up your governance proposal/i)).toBeInTheDocument()
  })
})
