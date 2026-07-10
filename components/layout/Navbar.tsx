import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { NAV_LINKS, siteConfig } from '@/lib/site-config'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'

/**
 * Fixed global navigation, rendered once from the root layout so every
 * current and future route shares the same chrome. Fully static — no
 * client-side state — so it stays a Server Component.
 */
export function Navbar() {
  return (
    <nav
      className="animate-drop fixed top-0 left-0 right-0 z-50 px-6 md:px-10 pt-6 flex items-center justify-between gap-4"
      aria-label="Gorillaz Tattoo Art main navigation"
    >
      <Link
        href={`${ROUTES.home}${HOME_SECTIONS.hero}`}
        className="flex items-center"
        aria-label={`${siteConfig.name} studio home`}
      >
        <Logo />
      </Link>

      <div className="hidden md:flex items-center gap-1 bg-neutral-900/90 backdrop-blur rounded-full px-3 py-2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-neutral-300 hover:text-white transition-colors text-sm px-5 py-2 rounded-full"
            title={`${siteConfig.name} studio — ${link.label}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <Link
        href={`${ROUTES.home}${HOME_SECTIONS.booking}`}
        className="bg-[#fabb42] text-black text-sm font-semibold rounded-full px-6 py-3 transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
        aria-label="Jump to the tattoo inquiry form"
      >
        inquire now
      </Link>
    </nav>
  )
}
