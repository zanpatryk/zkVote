import { render, screen } from '@testing-library/react'
import TabVotes from './TabVotes'
import '@testing-library/jest-dom'

jest.mock('@/components/VotesList', () => () => <div data-testid="votes-list">VotesList</div>)

describe('TabVotes', () => {
  it('renders all components', () => {
    render(<TabVotes pollId="123" pollState={1} />)
    
    expect(screen.getByText('Vote History')).toBeInTheDocument()
    expect(screen.getByText('Real-time ledger of all cast votes.')).toBeInTheDocument()
    expect(screen.getByTestId('votes-list')).toBeInTheDocument()
  })
})
