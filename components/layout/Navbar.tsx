'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { siteConfig } from '@/lib/site-config'
import { MobileNav } from '@/components/layout/MobileNav'
import { CtaPill } from '@/components/common/CtaPill'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'
import { cn } from '@/utils/cn'

const NAV_LINKS = [
  { label: 'portfolio', href: ROUTES.portfolio },
  { label: 'artists', href: `${ROUTES.home}${HOME_SECTIONS.artists}` },
  { label: 'process', href: `${ROUTES.home}${HOME_SECTIONS.process}` },
  { label: 'studio', href: `${ROUTES.home}${HOME_SECTIONS.about}` },
  { label: 'aftercare', href: ROUTES.aftercare },
  { label: 'faq', href: `${ROUTES.home}${HOME_SECTIONS.faq}` },
]

/**
 * Fixed global navigation, rendered once from the marketing layout so every
 * public page shares the same chrome.
 */
export function Navbar() {
  // Mirrors MobileNav's own open state (via onOpenChange) purely to hide
  // this logo — MobileNav's full-screen panel has its own logo, and
  // because that panel outranks this fixed nav's stacking context once
  // open, this one would otherwise bleed through underneath it, reading
  // as two overlapping logos.
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // All breakpoints: hide the bar on scroll down, bring it back on scroll
  // up. Skipped near the very top (within one bar height) so it doesn't
  // flicker hidden on the tiny downward scrolls that happen there.
  const [hidden, setHidden] = useState(false)
  // Separate from `hidden` so the entrance keyframes (which hold their
  // final `transform` via fill-mode "both") don't fight the hide/show
  // transform below — both would otherwise be animating the same
  // property on the same element. Swapped for a plain transition once
  // the entrance animation is done.
  const [entranceDone, setEntranceDone] = useState(false)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    lastScrollYRef.current = window.scrollY
    let raf = 0

    const update = () => {
      raf = 0
      const currentY = window.scrollY
      const scrollingDown = currentY > lastScrollYRef.current

      if (currentY < 96) {
        setHidden(false)
      } else if (scrollingDown) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastScrollYRef.current = currentY
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <nav
      onAnimationEnd={() => setEntranceDone(true)}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b border-transparent px-6 md:px-8 lg:px-10 pt-5 flex items-center justify-between gap-4',
        !entranceDone && 'animate-drop',
        entranceDone && 'transition-transform duration-300 ease-out',
        entranceDone && hidden ? '-translate-y-full' : 'translate-y-0',
      )}
      aria-label="Gorillaz Tattoo Art main navigation"
    >
      <Link
        href={`${ROUTES.home}${HOME_SECTIONS.hero}`}
        className={cn(
          'flex items-center flex-none transition-opacity',
          mobileMenuOpen && 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto',
        )}
        aria-label={`${siteConfig.name} studio home`}
      >
        <Logo className="h-11 w-auto md:h-12 lg:h-[52px]" width={162} height={52} />
      </Link>

      <div className="hidden lg:flex items-center justify-center gap-6 lg:gap-8 flex-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[13px] tracking-[0.02em] text-[var(--gz-ink-300)] hover:text-[var(--gz-paper-050)] transition-colors"
            title={`${siteConfig.name} studio — ${link.label}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* CtaPill's own base classes already include `inline-flex`
          unconditionally, so a conflicting `hidden` on the pill itself
          would lose the cascade to that (both are single-class selectors,
          and `cn()` doesn't dedupe) — toggling display on this wrapper
          instead avoids the clash. Hidden on all mobile/tablet sizes (only
          the burger icon shows there), matching MobileNav's own `lg:hidden`
          breakpoint; re-surfaces via the CtaPill already inside MobileNav's
          full-screen panel once opened. */}
      <div className="hidden lg:flex flex-none">
        <CtaPill
          href={`${ROUTES.home}${HOME_SECTIONS.inquire}`}
          className="tracking-[0.01em]"
          aria-label="Jump to the tattoo inquiry form"
        >
          Inquire now
        </CtaPill>
      </div>

      <MobileNav onOpenChange={setMobileMenuOpen} />
    </nav>
  )
}
