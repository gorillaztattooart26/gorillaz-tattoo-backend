import gorillazLogo from '../assets/gorillaz-logo-white.svg'

const NAV_LINKS = ['portfolio', 'artists', 'studio', 'booking'] as const

export default function Navbar() {
  return (
    <nav
      className="animate-drop fixed top-0 left-0 right-0 z-50 px-6 md:px-10 pt-6 flex items-center justify-between gap-4"
      aria-label="Gorillaz Tattoo Art main navigation"
    >
      <a
        href="#hero"
        className="flex items-center"
        aria-label="gorillaz tattoo art studio home"
      >
        <img
          src={gorillazLogo}
          alt="gorillaz tattoo art logo"
          className="h-14 w-auto"
        />
      </a>

      <div className="hidden md:flex items-center gap-1 bg-neutral-900/90 backdrop-blur rounded-full px-3 py-2">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href={`#${link}`}
            className="text-neutral-300 hover:text-white transition-colors text-sm px-5 py-2 rounded-full"
            title={`gorillaz tattoo art studio — ${link}`}
          >
            {link}
          </a>
        ))}
      </div>

      <button
        type="button"
        className="bg-[#fabb42] text-black text-sm font-semibold rounded-full px-6 py-3 transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
        aria-label="Book a tattoo session"
      >
        book session
      </button>
    </nav>
  )
}
