import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { NAV_LINKS, siteConfig } from '@/lib/site-config'

/** Global footer, rendered once from the root layout. Fully static — Server Component. */
export function Footer() {
  return (
    <footer
      aria-label="Gorillaz Tattoo Art footer"
      className="relative w-full bg-black px-6 md:px-10 pt-16 pb-10 border-t border-white/10"
    >
      <div className="reveal flex flex-col md:flex-row md:items-start md:justify-between gap-10">
        <div>
          <Logo className="h-12 w-auto" width={188} height={60} />
          <p className="mt-4 max-w-[280px] text-sm leading-snug text-white/70">
            custom ink design studio — philippines. fine lines, bold blackwork,
            permanent self-expression.
          </p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-col gap-2 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-neutral-300 hover:text-white transition-colors"
              title={`${siteConfig.name} studio — ${link.label}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          <a
            href={siteConfig.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white transition-colors"
            aria-label={`${siteConfig.name} on facebook`}
          >
            facebook
          </a>
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white transition-colors"
            aria-label={`${siteConfig.name} on instagram`}
          >
            instagram
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-neutral-300 hover:text-white transition-colors"
            aria-label={`email ${siteConfig.name} bookings`}
          >
            {siteConfig.email}
          </a>
        </div>
      </div>

      <p className="mt-16 text-xs text-white/40">
        © {new Date().getFullYear()} {siteConfig.name} — custom ink design
        studio, philippines. all rights reserved.
      </p>
    </footer>
  )
}
