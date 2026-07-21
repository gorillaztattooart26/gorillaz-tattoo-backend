import { HOME_SECTIONS } from '@/lib/routes'

/**
 * Homepage hero. Fully static (CSS-driven entrance animations only) —
 * Server Component. The fixed Navbar now lives in the root layout instead
 * of being nested here, but visually nothing changes since it was already
 * position: fixed.
 */
export function Hero() {
  return (
    <section
      id="hero"
      role="region"
      aria-label="Gorillaz Tattoo Art Hero"
      className="relative min-h-screen w-full overflow-hidden bg-neutral-900"
    >
      {/*
       * Full-bleed background photo — a separate portrait shot on mobile
       * rather than the desktop photo cropped down. `next/image` can't
       * swap to a wholly different source per breakpoint, so this uses a
       * native `<picture>` with a `max-width` source instead; the browser
       * picks one and only downloads that one.
       */}
      <div className="animate-settle absolute inset-0">
        <picture>
          <source media="(max-width: 767px)" srcSet="/images/studio/hero-mobile.jpg" />
          <img
            src="/images/studio/studio-lounge.jpg"
            alt="Gorillaz Tattoo Art studio lounge"
            title="gorillaz tattoo art — studio lounge"
            fetchPriority="high"
            loading="eager"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      {/* Tagline + links — upper right, beside the portrait */}
      <div
        className="animate-rise absolute right-6 md:right-12 top-[38%] md:top-[26%] max-w-[240px] text-right"
        style={{ animationDelay: '0.6s' }}
      >
        <p className="text-xs md:text-sm leading-relaxed text-white/70">
          tattoos are art you carry with you, even in the darkest times.
        </p>
        <div className="mt-4 flex flex-col items-end gap-1">
          <a
            href={HOME_SECTIONS.portfolio}
            className="text-xs md:text-sm text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
          >
            see our work
          </a>
          <a
            href={HOME_SECTIONS.booking}
            className="text-xs md:text-sm text-white underline underline-offset-4 decoration-white/40 hover:decoration-white transition-colors"
          >
            contact
          </a>
        </div>
      </div>

      {/* Giant wordmark — bottom left */}
      <div className="absolute left-4 md:left-10 bottom-10 md:bottom-14 z-10">
        <h1
          className="animate-rise hero-title first-letter:uppercase text-white font-medium text-[19vw] md:text-[9vw] lg:text-[7.5vw]"
          style={{ animationDelay: '0.3s' }}
          title="ink beyond ordinary"
        >
          ink beyond
        </h1>
        <h1
          className="animate-rise hero-title first-letter:uppercase text-white font-medium text-[19vw] md:text-[9vw] lg:text-[7.5vw]"
          style={{ animationDelay: '0.45s' }}
        >
          ordinary
        </h1>
      </div>
    </section>
  )
}
