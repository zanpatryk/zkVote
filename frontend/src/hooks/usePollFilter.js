import { useState, useMemo } from 'react'

export function usePollFilter(polls) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredPolls = useMemo(() => {
    if (!polls) return []
    
    return polls.filter(poll => {
      const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase())
      // Ensure state is string for comparison, handle BigInt if necessary by converting to string
      const pollState = poll.state?.toString() 
      const matchesStatus = statusFilter === 'all' || pollState === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [polls, searchQuery, statusFilter])

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredPolls
  }
}
