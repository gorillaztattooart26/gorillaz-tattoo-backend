import Image from 'next/image'
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
      {/* Portrait — bleeds off the right edge, grayscale */}
      <div className="animate-settle absolute inset-y-0 right-0 w-full md:w-[60%] lg:w-[56%]">
        <Image
          src="/images/artists/artist-3.jpg"
          alt="Gorillaz tattoo artist at work, portrait in black and white"
          title="gorillaz tattoo art — resident artist"
          fill
          priority
          sizes="(min-width: 1024px) 56vw, (min-width: 768px) 60vw, 100vw"
          className="object-cover object-[70%_15%] grayscale"
        />
        {/* blend into background on the left */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-neutral-900 to-transparent" />
        {/* blend into background at the bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-neutral-900 to-transparent" />
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
