import gorillazLogo from '../assets/gorillaz-logo-white.svg'

const FOOTER_LINKS = ['portfolio', 'artists', 'studio', 'booking'] as const

export default function Footer() {
  return (
    <footer
      aria-label="Gorillaz Tattoo Art footer"
      className="relative w-full bg-black px-6 md:px-10 pt-16 pb-10 border-t border-white/10"
    >
      <div className="reveal flex flex-col md:flex-row md:items-start md:justify-between gap-10">
        <div>
          <img
            src={gorillazLogo}
            alt="gorillaz tattoo art logo"
            className="h-12 w-auto"
          />
          <p className="mt-4 max-w-[280px] text-sm leading-snug text-white/70">
            custom ink design studio — philippines. fine lines, bold blackwork,
            permanent self-expression.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-col gap-2 text-sm"
        >
          {FOOTER_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link}`}
              className="text-neutral-300 hover:text-white transition-colors"
              title={`gorillaz tattoo art studio — ${link}`}
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white transition-colors"
            aria-label="gorillaz tattoo art on facebook"
          >
            facebook
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-300 hover:text-white transition-colors"
            aria-label="gorillaz tattoo art on instagram"
          >
            instagram
          </a>
          <a
            href="mailto:bookings@gorillaztattoo.art"
            className="text-neutral-300 hover:text-white transition-colors"
            aria-label="email gorillaz tattoo art bookings"
          >
            bookings@gorillaztattoo.art
          </a>
        </div>
      </div>

      <p className="mt-16 text-xs text-white/40">
        © {new Date().getFullYear()} gorillaz tattoo art — custom ink design
        studio, philippines. all rights reserved.
      </p>
    </footer>
  )
}
