'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

/**
 * Mounted once in the root layout. Renders nothing — just activates the
 * `.reveal` scroll-in animation for every page, without making the page
 * content itself a client component.
 */
export function ScrollRevealProvider() {
  useScrollReveal()
  return null
}
