import { HOME_SECTIONS, ROUTES } from '@/lib/routes'
import { CtaPill } from '@/components/common/CtaPill'

const MARQUEE_PHRASES = [
  'Realism',
  'Black and grey',
  'Fine line',
  'Blackwork',
  'Custom large-scale',
]

interface HeroProps {
  /** Falls back to the static default reel when no video has been uploaded through the staff dashboard. */
  videoUrl?: string
}

/**
 * Homepage hero. Fully static (CSS-driven entrance animations only) —
 * Server Component. The feature tile plays the studio reel, either the
 * default file or whatever's been uploaded via the staff dashboard's
 * "Homepage Hero Video" card.
 */
export function Hero({ videoUrl = '/videos/homepage-v2/hero-video.mp4' }: HeroProps) {
  const marquee = [...MARQUEE_PHRASES, ...MARQUEE_PHRASES]

  return (
    <section
      id="hero"
      role="region"
      aria-label="Gorillaz Tattoo Art Hero"
      className="relative flex min-h-[clamp(560px,100svh,900px)] flex-col justify-between gap-10 overflow-hidden pt-[100px] md:pt-[130px]"
    >
      {/* Decorative geometric accent, top right — purely ornamental.
          Mobile pushes much further right (translate-x-[82%] vs 34% on
          desktop) so it clears the headline instead of overlapping it —
          most of the box sits off-screen, only a sliver peeks in. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 h-[360px] w-[300px] translate-x-[82%] translate-y-[-48%] opacity-30 md:h-[720px] md:w-[620px] md:translate-x-[34%]"
      >
        <div className="absolute inset-0 border border-white/[0.13]" />
        <div className="gz-arc-full absolute inset-0 border border-[var(--gz-copper-500)] shadow-[0_0_8px_rgba(196,98,43,0.45)] [animation:gz-arc-full_6.5s_cubic-bezier(0.45,0,0.55,1)_infinite]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-6 md:px-10">
        <span className="animate-rise block font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
          Custom tattoo studio —
        </span>
        <h1
          className="animate-rise mt-3 text-[15vw] font-normal uppercase leading-[0.84] text-[var(--gz-paper-050)] md:text-[9vw] lg:text-[7.5vw] [font-family:var(--font-gz-display)]"
          style={{ animationDelay: '80ms' }}
        >
          Permanence
          <br />
          is the point
        </h1>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-col items-stretch gap-8 px-6 md:px-10 lg:flex-row lg:flex-wrap lg:items-end">
        <div
          className="animate-rise flex w-full flex-col gap-3 pb-1.5 lg:w-auto lg:min-w-[220px] lg:flex-1"
          style={{ animationDelay: '160ms' }}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
            01 — The studio
          </span>
          <p className="max-w-[32ch] text-[15px] leading-relaxed text-[var(--gz-ink-300)]">
            A professional custom tattoo studio in the Philippines — realism, black
            and grey, fine line and large-scale work by our resident artists.
          </p>
        </div>

        <div
          className="animate-rise relative w-full max-h-[42svh] overflow-hidden bg-[var(--gz-ink-900)] lg:w-auto lg:min-w-[280px] lg:flex-[1_1_min(100%,300px)]"
          style={{ animationDelay: '220ms', aspectRatio: '1 / 1' }}
        >
          <video
            key={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(11,10,9,0.62)] to-transparent" />
        </div>

        <div
          className="animate-rise flex w-full flex-col gap-4 pb-1.5 lg:w-auto lg:min-w-[240px] lg:flex-1"
          style={{ animationDelay: '280ms' }}
        >
          <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--gz-ink-300)]">
            Every tattoo starts with a consultation. Send a paragraph and two
            references — we reply within 48 hours.
          </p>
          <div className="flex flex-wrap gap-3">
            <CtaPill href={`${ROUTES.home}${HOME_SECTIONS.inquire}`}>Inquire now</CtaPill>
            <CtaPill href={ROUTES.portfolio} iconVariant="default">
              View the portfolio
            </CtaPill>
          </div>
        </div>
      </div>

      <div className="relative z-10 overflow-hidden border-y border-[var(--gz-border-subtle)] py-4 md:py-5">
        <div className="animate-marquee flex w-max items-center gap-11 whitespace-nowrap">
          {[...marquee, ...marquee].map((phrase, index) => (
            <span
              key={index}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--gz-ink-400)]"
            >
              {phrase} ·
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
