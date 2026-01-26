"use client"

import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Unified back button component with consistent styling.
 * Uses browser history by default, or custom href if provided.
 * 
 * @param {string} href - Optional custom redirect path
 * @param {string} label - Optional custom label (default: "Go Back")
 * @param {string} variant - 'arrow' (← label) or 'bracket' ([ label ])
 * @param {string} className - Additional CSS classes
 */
export default function BackButton({ 
  href, 
  label = "Go Back", 
  variant = "arrow",
  direction = "back",
  className = "" 
}) {
  const router = useRouter()
  
  const formattedLabel = variant === "bracket" 
    ? `[ ${label} ]` 
    : direction === "forward" ? `${label} →` : `← ${label}`
  
  const baseStyles = "text-gray-600 hover:text-black font-medium transition flex items-center gap-2"
  const combinedStyles = `${baseStyles} ${className}`

  // If href is provided, use Link
  if (href) {
    return (
      <Link href={href}>
        <button className={combinedStyles}>
          {formattedLabel}
        </button>
      </Link>
    )
  }

  // Otherwise use router.back()
  return (
    <button 
      onClick={() => router.back()} 
      className={combinedStyles}
    >
      {formattedLabel}
    </button>
  )
}
