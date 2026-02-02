'use client'

import { createContext, useContext, useState, useRef } from 'react'

const IdentityTransferContext = createContext(null)

export function IdentityTransferProvider({ children }) {
  // Use ref to store the identity to discourage reactivity (we don't want re-renders)
  // and ensure it's transient
  const pendingIdentity = useRef(null)
  
  const setIdentity = (identity, pollId) => {
    pendingIdentity.current = { identity, pollId }
  }

  const consumeIdentity = (pollId) => {
    if (!pendingIdentity.current) return null
    
    // Only return if it matches the requested pollId
    if (String(pendingIdentity.current.pollId) !== String(pollId)) {
        return null
    }

    const { identity } = pendingIdentity.current
    
    // WIPEOUT immediately after consumption
    pendingIdentity.current = null
    
    return identity
  }

  const hasPendingIdentity = (pollId) => {
     return !!(pendingIdentity.current && String(pendingIdentity.current.pollId) === String(pollId))
  }

  return (
    <IdentityTransferContext.Provider value={{ setIdentity, consumeIdentity, hasPendingIdentity }}>
      {children}
    </IdentityTransferContext.Provider>
  )
}

export function useIdentityTransfer() {
  const context = useContext(IdentityTransferContext)
  if (!context) {
    throw new Error('useIdentityTransfer must be used within IdentityTransferProvider')
  }
  return context
}
