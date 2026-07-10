'use client'

import { useEffect } from 'react'

/**
 * Adds `.is-visible` to any `.reveal` element once it scrolls into the
 * viewport, matching the fade/translate defined in styles/globals.css.
 * Uses IntersectionObserver instead of a scroll+interval poll, so it costs
 * near-zero main-thread work compared to the original implementation.
 */
export function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0 },
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
