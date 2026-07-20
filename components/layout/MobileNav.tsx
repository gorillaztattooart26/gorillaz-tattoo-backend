'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { NAV_LINKS, siteConfig } from '@/lib/site-config'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'

/** Mobile-only nav trigger — collapses the links + inquire now button behind a burger menu below `md`. */
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/90 backdrop-blur text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/*
       * Portaled to `document.body` rather than rendered in place: the fixed
       * navbar has a `transform`-based entrance animation, and CSS spec says
       * any ancestor with a non-`none` transform becomes the containing
       * block for `position: fixed` descendants. Left in place, this panel
       * would be sized/positioned relative to the (short) navbar instead of
       * the viewport, instead of covering the full screen.
       */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-black px-6 pb-10 pt-6">
            <Link
              href={`${ROUTES.home}${HOME_SECTIONS.hero}`}
              onClick={() => setOpen(false)}
              className="flex items-center"
              aria-label={`${siteConfig.name} studio home`}
            >
              <Logo />
            </Link>

            <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-white text-2xl"
                  title={`${siteConfig.name} studio — ${link.label}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={`${ROUTES.home}${HOME_SECTIONS.booking}`}
                onClick={() => setOpen(false)}
                className="mt-4 bg-[#fabb42] text-black text-sm font-semibold rounded-full px-8 py-3 text-center transition-all duration-300 hover:bg-[#ffc85c]"
                aria-label="Jump to the tattoo inquiry form"
              >
                inquire now
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
