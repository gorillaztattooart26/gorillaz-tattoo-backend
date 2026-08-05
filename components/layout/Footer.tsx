import Link from 'next/link'
import { Logo } from '@/components/common/Logo'
import { siteConfig } from '@/lib/site-config'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'

const NAV_LINKS = [
  { label: 'Portfolio', href: ROUTES.portfolio },
  { label: 'Artists', href: ROUTES.artists },
  { label: 'About', href: ROUTES.about },
  { label: 'Aftercare', href: ROUTES.aftercare },
  { label: 'Contact', href: ROUTES.contact },
  { label: 'FAQ', href: `${ROUTES.home}${HOME_SECTIONS.faq}` },
]

/** Global footer, rendered once from the marketing layout. */
export function Footer() {
  return (
    <footer
      aria-label="Gorillaz Tattoo Art footer"
      className="relative w-full bg-[var(--gz-ink-950)] px-6 md:px-10 pb-8 pt-14 md:pb-12 md:pt-20"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-10 md:gap-16">
        <div className="reveal flex flex-wrap justify-between gap-8 md:gap-16">
          <div className="flex flex-1 basis-[240px] flex-col items-start gap-4">
            <Logo className="h-[73px] w-auto self-start" width={227} height={73} />
            <p className="max-w-[30ch] text-sm leading-relaxed text-[var(--gz-ink-400)]">
              Custom tattoo studio in Santa Rosa, Laguna. Realism, black and
              grey, fine line and large-scale work since 2011.
            </p>
          </div>

          <div className="flex flex-wrap gap-16 md:gap-24">
            <nav
              aria-label="Footer navigation"
              className="flex flex-col gap-3.5"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
                Studio
              </span>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--gz-ink-300)] hover:text-[var(--gz-paper-050)] transition-colors"
                  title={`${siteConfig.name} studio — ${link.label}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
                Contact
              </span>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--gz-ink-300)] hover:text-[var(--gz-paper-050)] transition-colors"
                aria-label={`${siteConfig.name} on instagram`}
              >
                Instagram
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--gz-ink-300)] hover:text-[var(--gz-paper-050)] transition-colors"
                aria-label={`${siteConfig.name} on facebook`}
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3.5 border-t border-[var(--gz-border-subtle)] pt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)] md:flex-row md:items-center md:justify-between md:gap-4">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
          <Link
            href={`${ROUTES.home}${HOME_SECTIONS.hero}`}
            className="hover:text-[var(--gz-paper-050)] transition-colors"
          >
            Back to top ↑
          </Link>
        </div>
      </div>
    </footer>
  )
}
