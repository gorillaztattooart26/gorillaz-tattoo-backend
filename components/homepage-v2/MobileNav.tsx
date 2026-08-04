'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { siteConfig } from '@/lib/site-config'
import { CtaPill } from '@/components/homepage-v2/CtaPill'
import { V2_SECTIONS } from '@/components/homepage-v2/routes'

const NAV_LINKS = [
  { label: 'portfolio', href: V2_SECTIONS.work },
  { label: 'artists', href: V2_SECTIONS.artists },
  { label: 'process', href: V2_SECTIONS.process },
  { label: 'studio', href: V2_SECTIONS.about },
  { label: 'aftercare', href: V2_SECTIONS.aftercare },
  { label: 'faq', href: V2_SECTIONS.faq },
]

interface MobileNavProps {
  /** Lets Navbar hide its own (otherwise duplicate-looking) logo while
   *  this panel's own logo is on screen — see the opacity toggle there. */
  onOpenChange?: (open: boolean) => void
}

/** Mobile-only nav trigger for the /homepage-v2 draft — local to this route. */
export function MobileNav({ onOpenChange }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    setPortalRoot(document.getElementById('gz-v2-portal-root'))
  }, [])

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <div className="lg:hidden">
      {/* Only ever shows the "open" icon — the panel below has its own
          close button, since this one is a Navbar descendant and can't
          paint above the panel's higher stacking context once it's open
          (see the note there). Keeping this one open-only avoids a dead,
          covered "X" sitting uselessly behind the panel. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="relative z-50 flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--gz-border-default)] bg-[var(--gz-ink-900)] text-[var(--gz-paper-050)]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portaled into #gz-v2-portal-root (a sibling of Navbar, set up in
          app/homepage-v2/layout.tsx) rather than document.body — that keeps
          this panel inside the div carrying the --font-gz-* CSS variables
          (document.body itself is outside it, which was silently falling
          the nav links back to the browser default font), while still
          escaping Navbar's transform-based entrance animation, which would
          otherwise become this panel's containing block. */}
      {mounted &&
        open &&
        portalRoot &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[var(--gz-ink-950)] px-6 pb-10 pt-6">
            {/* Own close control, positioned to match the trigger button —
                that one is a Navbar descendant, so it's confined to
                Navbar's z-50 stacking context and can't paint above this
                panel; duplicating it here (instead of relying on it) also
                avoids it silently becoming unclickable while covered. */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-6 top-6 flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--gz-copper-500)] bg-[var(--gz-ink-900)] text-[var(--gz-paper-050)]"
            >
              <X className="h-5 w-5" />
            </button>

            <a
              href={V2_SECTIONS.hero}
              onClick={() => setOpen(false)}
              className="flex items-center"
              aria-label={`${siteConfig.name} studio home`}
            >
              <Logo className="h-11 w-auto" width={162} height={52} />
            </a>

            <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="w-full max-w-xs border-b border-[var(--gz-border-subtle)] py-4 text-center text-[26px] uppercase tracking-[0.03em] text-[var(--gz-paper-050)] hover:text-[var(--gz-copper-300)] [font-family:var(--font-gz-display)]"
                  title={`${siteConfig.name} studio — ${link.label}`}
                >
                  {link.label}
                </a>
              ))}
              <CtaPill
                href={V2_SECTIONS.inquire}
                onClick={() => setOpen(false)}
                className="mt-6 self-center"
                aria-label="Jump to the tattoo inquiry form"
              >
                Inquire now
              </CtaPill>
            </div>
          </div>,
          portalRoot,
        )}
    </div>
  )
}
