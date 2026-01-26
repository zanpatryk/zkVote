'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to determine if the component has mounted on the client.
 * Useful for preventing hydration mismatches in Next.js.
 * 
 * @returns {boolean} True if the component has mounted.
 */
export function useIsMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
