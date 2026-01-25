import { render, screen, act } from '@testing-library/react'
import { IdentityTransferProvider, useIdentityTransfer } from './IdentityTransferContext'
import { useEffect } from 'react'
import '@testing-library/jest-dom'

// Test helper component
function TestComponent({ onMount, action }) {
  const context = useIdentityTransfer()
  
  useEffect(() => {
    if (onMount) onMount(context)
  }, [onMount, context])

  // Allow triggering actions from props for easier testing of flow
  if (action) {
     action(context)
  }

  return <div>Test Component</div>
}

describe('IdentityTransferContext', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useIdentityTransfer must be used within IdentityTransferProvider')
    
    spy.mockRestore()
  })

  it('provides methods through context', () => {
    let contextValues
    render(
      <IdentityTransferProvider>
        <TestComponent onMount={(ctx) => contextValues = ctx} />
      </IdentityTransferProvider>
    )

    expect(contextValues).toHaveProperty('setIdentity')
    expect(contextValues).toHaveProperty('consumeIdentity')
    expect(contextValues).toHaveProperty('hasPendingIdentity')
  })

  it('sets and correctly consumes identity', () => {
    let contextValues
    render(
      <IdentityTransferProvider>
        <TestComponent onMount={(ctx) => contextValues = ctx} />
      </IdentityTransferProvider>
    )

    const mockIdentity = { commitment: '123' }
    
    act(() => {
        contextValues.setIdentity(mockIdentity, 'poll-1')
    })
    
    // Check existence
    expect(contextValues.hasPendingIdentity('poll-1')).toBe(true)
    
    // Consume
    let consumed
    act(() => {
        consumed = contextValues.consumeIdentity('poll-1')
    })
    
    expect(consumed).toBe(mockIdentity)
    
    // Check wipeout
    expect(contextValues.hasPendingIdentity('poll-1')).toBe(false)
    expect(contextValues.consumeIdentity('poll-1')).toBeNull()
  })

  it('enforces pollId match', () => {
    let contextValues
    render(
      <IdentityTransferProvider>
        <TestComponent onMount={(ctx) => contextValues = ctx} />
      </IdentityTransferProvider>
    )

    const mockIdentity = { commitment: '123' }
    
    act(() => {
        contextValues.setIdentity(mockIdentity, 'poll-1')
    })
    
    // Try consume with wrong pollId
    let consumed
    act(() => {
        consumed = contextValues.consumeIdentity('poll-2')
    })
    
    expect(consumed).toBeNull()
    
    // Identity should still be there for correct pollId
    expect(contextValues.hasPendingIdentity('poll-1')).toBe(true)
    
    // Now consume correctly
    act(() => {
        consumed = contextValues.consumeIdentity('poll-1')
    })
    expect(consumed).toBe(mockIdentity)
  })

  it('handles string/number pollId mismatch gracefully', () => {
    // Context logic uses String() conversion, so '123' and 123 should match
    let contextValues
    render(
      <IdentityTransferProvider>
        <TestComponent onMount={(ctx) => contextValues = ctx} />
      </IdentityTransferProvider>
    )

    const mockIdentity = { commitment: '123' }
    
    act(() => {
        contextValues.setIdentity(mockIdentity, 123)
    })
    
    // Check existence with string
    expect(contextValues.hasPendingIdentity('123')).toBe(true)
    
    // Consume with string
    let consumed
    act(() => {
        consumed = contextValues.consumeIdentity('123')
    })
    
    expect(consumed).toBe(mockIdentity)
  })
})
