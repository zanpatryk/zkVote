import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreatePollPage from '../src/app/poll/create/page'
import '@testing-library/jest-dom'
import { toast } from 'react-hot-toast'
import { MODULE_ADDRESSES } from '../src/lib/contracts'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: jest.fn(),
}))

// Mock wagmi
const mockUseAccount = jest.fn()
jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
}))

// Mock blockchain write function
const mockCreatePoll = jest.fn()
jest.mock('../src/lib/blockchain/engine/write', () => ({
  createPoll: (...args) => mockCreatePoll(...args),
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn((promise) => promise),
  },
}))

// Mock elgamal library
jest.mock('@zkvote/lib', () => ({
  elgamal: {
    init: jest.fn().mockResolvedValue(true),
    generateKeyPair: jest.fn().mockReturnValue({
      sk: BigInt(12345),
      pk: [BigInt(99999), BigInt(88888)]
    })
  }
}))

describe('Integration Test: Poll Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAccount.mockReturnValue({ isConnected: true })
    mockCreatePoll.mockResolvedValue(BigInt(100))
  })

  const fillBasicForm = (title = 'Frameworks', description = 'Which one?', options = ['React', 'Vue']) => {
    fireEvent.change(screen.getByPlaceholderText('e.g., Should we adopt the new governance proposal?'), { target: { value: title } })
    fireEvent.change(screen.getByPlaceholderText('Provide context for voters...'), { target: { value: description } })
    
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/)
    options.forEach((opt, idx) => {
      if (optionInputs[idx]) fireEvent.change(optionInputs[idx], { target: { value: opt } })
    })
  }

  it('Create Default Poll (Anonymous=True, Secret=False)', async () => {
    render(<CreatePollPage />)
    
    fillBasicForm()
    
    // Anonymity is ON by default. Secrecy is OFF by default.
    fireEvent.submit(screen.getByRole('button', { name: /launch poll/i }))

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Frameworks',
        merkleTreeDepth: 20, // Default depth
        eligibilityModule: MODULE_ADDRESSES.semaphoreEligibility,
        voteStorage: MODULE_ADDRESSES.voteStorageV0,
        voteStorageParams: null
      }))
    })
  })

  it('Create Public Poll (Anonymous=False, Secret=False)', async () => {
    render(<CreatePollPage />)
    
    fillBasicForm()

    // Toggle Anonymity OFF
    fireEvent.click(screen.getByText('Anonymity').closest('div').parentElement)

    fireEvent.submit(screen.getByRole('button', { name: /launch poll/i }))

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith(expect.objectContaining({
        merkleTreeDepth: 0, // Should be 0 when not anonymous
        eligibilityModule: MODULE_ADDRESSES.eligibilityV0,
        voteStorage: MODULE_ADDRESSES.voteStorageV0,
      }))
    })
  })

  it('Create Secret Poll (Anonymous=False, Secret=True)', async () => {
    render(<CreatePollPage />)
    
    fillBasicForm()

    // Toggle Anonymity OFF
    fireEvent.click(screen.getByText('Anonymity').closest('div').parentElement)
    
    // Toggle Secrecy ON
    fireEvent.click(screen.getByText('Secrecy').closest('div').parentElement)

    // Check validation: requires keys
    fireEvent.submit(screen.getByRole('button', { name: /launch poll/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please generate and save your encryption keys', expect.anything())
    })

    // Generate Keys
    fireEvent.click(screen.getByText('Generate Encryption Keys'))
    await waitFor(() => {
        expect(screen.getByText(/Your Secret Key/)).toBeInTheDocument()
    })

    // Confirm Saved
    fireEvent.click(screen.getByLabelText('I have saved my secret key securely'))

    // Submit
    fireEvent.submit(screen.getByRole('button', { name: /launch poll/i }))

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith(expect.objectContaining({
        merkleTreeDepth: 0, 
        eligibilityModule: MODULE_ADDRESSES.eligibilityV0,
        voteStorage: MODULE_ADDRESSES.zkElGamalVoteVector,
        voteStorageParams: {
           publicKey: ['99999', '88888']
        }
      }))
    })
  })

  it('Create ZK Encrypted Poll (Anonymous=True, Secret=True)', async () => {
    render(<CreatePollPage />)
    
    fillBasicForm()

    // Anonymity ON by default.
    // Toggle Secrecy ON
    fireEvent.click(screen.getByText('Secrecy').closest('div').parentElement)

    // Generate Keys
    fireEvent.click(screen.getByText('Generate Encryption Keys'))
    await waitFor(() => screen.getByLabelText('I have saved my secret key securely'))
    fireEvent.click(screen.getByLabelText('I have saved my secret key securely'))

    // Submit
    fireEvent.submit(screen.getByRole('button', { name: /launch poll/i }))

    await waitFor(() => {
      expect(mockCreatePoll).toHaveBeenCalledWith(expect.objectContaining({
        merkleTreeDepth: 20, 
        eligibilityModule: MODULE_ADDRESSES.semaphoreEligibility,
        voteStorage: MODULE_ADDRESSES.zkElGamalVoteVector,
        voteStorageParams: {
           publicKey: ['99999', '88888']
        }
      }))
    })
  })

  it('Truncates options if Secrecy is enabled > 16 options', async () => {
    const user = {
        setup: () => render(<CreatePollPage />)
    }
    user.setup()
    
    // Default has 2 options. Add 16 more to get 18.
    const addButton = screen.getByText('+ Add Another Option')
    
    // We can't use fireEvent in a loop too fast or React state updates might batch/lag in tests? 
    // Usually fireEvent is sync.
    for (let i = 0; i < 16; i++) {
        fireEvent.click(addButton)
    }

    const inputs = screen.getAllByPlaceholderText(/Option \d/)
    expect(inputs.length).toBe(18)
    
    // Toggle Secrecy ON
    // Based on PollSettings component structure, find the toggle
    const secrecyToggle = screen.getByText('Secrecy').closest('div').parentElement
    fireEvent.click(secrecyToggle)
    
    // Should now be truncated to 16
    await waitFor(() => {
        const truncatedInputs = screen.getAllByPlaceholderText(/Option \d/)
        expect(truncatedInputs.length).toBe(16)
    })

    // Try adding one more while Secret is ON
    // The button should be disabled, so clicking it won't trigger the toast (or even fire click).
    // Instead, verify it is disabled.
    expect(addButton).toBeDisabled()
    
    // And verify count remains 16
    const finalInputs = screen.getAllByPlaceholderText(/Option \d/)
    expect(finalInputs.length).toBe(16)
  })
})
