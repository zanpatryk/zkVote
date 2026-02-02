import { renderHook, act } from '@testing-library/react'
import { usePollFilter } from './usePollFilter'

describe('usePollFilter', () => {
  const mockPolls = [
    { pollId: 1n, title: 'Alpha Poll', state: 0 }, // Created
    { pollId: 2n, title: 'Beta Poll', state: 1 }, // Ongoing
    { pollId: 3n, title: 'Gamma Poll', state: 2 }, // Ended
  ]

  it('returns all polls by default', () => {
    const { result } = renderHook(() => usePollFilter(mockPolls))
    
    expect(result.current.filteredPolls).toHaveLength(3)
    expect(result.current.searchQuery).toBe('')
    expect(result.current.statusFilter).toBe('all')
  })

  it('filters by search query', () => {
    const { result } = renderHook(() => usePollFilter(mockPolls))

    act(() => {
      result.current.setSearchQuery('alpha')
    })

    expect(result.current.filteredPolls).toHaveLength(1)
    expect(result.current.filteredPolls[0].title).toBe('Alpha Poll')
  })

  it('filters by status', () => {
    const { result } = renderHook(() => usePollFilter(mockPolls))

    act(() => {
      result.current.setStatusFilter('1') // Ongoing
    })

    expect(result.current.filteredPolls).toHaveLength(1)
    expect(result.current.filteredPolls[0].title).toBe('Beta Poll')
  })

  it('combines search and status filters', () => {
    const { result } = renderHook(() => usePollFilter(mockPolls))

    act(() => {
      result.current.setSearchQuery('gamma')
      result.current.setStatusFilter('2')
    })

    expect(result.current.filteredPolls).toHaveLength(1)
    expect(result.current.filteredPolls[0].title).toBe('Gamma Poll')
  })

  it('returns empty array if no matches', () => {
    const { result } = renderHook(() => usePollFilter(mockPolls))

    act(() => {
      result.current.setSearchQuery('Zeta')
    })

    expect(result.current.filteredPolls).toHaveLength(0)
  })

  it('handles null polls input', () => {
    const { result } = renderHook(() => usePollFilter(null))
    expect(result.current.filteredPolls).toEqual([])
  })
})
