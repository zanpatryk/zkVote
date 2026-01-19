import { render, screen, fireEvent } from '@testing-library/react'
import NFTCard from './NFTCard'

describe('NFTCard', () => {
  const mockNFT = {
    name: 'Test Badge',
    description: 'A badge for testing',
    attributes: [
      { trait_type: 'Poll', value: 'Test Poll' },
      { trait_type: 'Role', value: 'Voter' }
    ]
  }

  it('renders NFT details correctly', () => {
    render(<NFTCard nft={mockNFT} />)

    expect(screen.getByText('Test Badge')).toBeInTheDocument()
    expect(screen.getByText('A badge for testing')).toBeInTheDocument()
    
    // Click to expand to see attributes
    fireEvent.click(screen.getByText('Test Badge'))
    
    expect(screen.getByText('Test Poll')).toBeInTheDocument()
    expect(screen.getByText('Voter')).toBeInTheDocument()
  })

  it('renders correctly without attributes', () => {
      const simpleNFT = {
          name: 'Simple Badge',
          description: 'No attrs'
      }
      render(<NFTCard nft={simpleNFT} />)
      expect(screen.getByText('Simple Badge')).toBeInTheDocument()
      expect(screen.getByText('No attrs')).toBeInTheDocument()
  })
})
