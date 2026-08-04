'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Adds `.is-visible` to any `.reveal` element once it scrolls into the
 * viewport, matching the fade/translate defined in styles/globals.css.
 * Uses IntersectionObserver instead of a scroll+interval poll, so it costs
 * near-zero main-thread work compared to the original implementation.
 *
 * Depends on `pathname` because this hook lives in a root-layout provider
 * that never remounts on client-side navigation — without it, `.reveal`
 * elements on a page you navigate *to* would never get observed and would
 * stay stuck at `opacity: 0` until a full page refresh.
 *
 * Also watches for `.reveal` elements added to the DOM after this effect's
 * initial scan (e.g. inside client components that render their content a
 * tick after the page shell mounts) — otherwise those miss the initial
 * `querySelectorAll` and never get observed at all.
 */
export function useScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target
            observer.unobserve(target)
            // Deferred a frame so elements already in view on mount (the
            // rootMargin below intentionally covers those) never get their
            // class mutated in the same tick as React's hydration commit —
            // doing so raced React's hydration bookkeeping and logged a
            // spurious "tree hydrated but attributes didn't match" warning,
            // even though this is a post-hydration reveal, not a real
            // server/client markup mismatch. One frame is imperceptible.
            requestAnimationFrame(() => target.classList.add('is-visible'))
          }
        }
      },
      { rootMargin: '0px 0px 120px 0px', threshold: 0 },
    )

    document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => observer.observe(el))

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches('.reveal')) observer.observe(node)
          node.querySelectorAll<HTMLElement>('.reveal').forEach((el) => observer.observe(el))
        }
      }
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [pathname])
}
