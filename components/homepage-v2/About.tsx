import Image from 'next/image'
import { V2_SECTIONS } from '@/components/homepage-v2/routes'
import { CtaPill } from '@/components/homepage-v2/CtaPill'

/** Homepage "about the studio" section. Server Component. */
export function About() {
  return (
    <section
      id="about"
      role="region"
      aria-label="Gorillaz Tattoo Art studio — based in the Philippines"
      className="relative w-full overflow-hidden bg-[var(--gz-ink-950)] py-16 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -right-12 z-0 aspect-square w-[213px] opacity-30 md:-right-24 md:w-[466px]"
      >
        <div className="absolute inset-0 rounded-full border border-white/[0.13]" />
        <div className="gz-arc absolute inset-0 rounded-full border border-[var(--gz-copper-500)] opacity-90 shadow-[0_0_8px_rgba(196,98,43,0.45)] [animation:gz-arc_6.5s_cubic-bezier(0.45,0,0.55,1)_infinite]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1720px] flex-col gap-8 px-6 md:gap-14 md:px-8">
        <h2 className="reveal m-0 text-[13.5vw] font-normal uppercase leading-[0.86] text-[var(--gz-paper-050)] md:text-[8.4vw] [font-family:var(--font-gz-display)]">
          About the studio
        </h2>

        {/*
         * Explicit grid-column/grid-row (via arbitrary values) at lg —
         * not separate col-start and col-span utilities combined, which
         * conflict: a col-span utility sets the full `grid-column`
         * shorthand, resetting whatever grid-column-start a separate
         * col-start utility set, if the span utility wins the cascade.
         * Explicit line ranges sidestep that entirely: image col 1,
         * paragraphs cols 2 and 3 on row 1, CTA spanning cols 2-3 on row 2.
         */}
        <div className="grid w-full grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-13">
          <div className="reveal relative row-span-2 aspect-[4/5] w-full overflow-hidden bg-[var(--gz-ink-900)] lg:[grid-column:1/2] lg:[grid-row:1/3]">
            <Image
              src="/images/studio/studio-interior.jpg"
              alt="Inside Gorillaz Tattoo Art — private tattoo studio in the Philippines"
              title="Gorillaz Tattoo Art — studio interior"
              fill
              loading="lazy"
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(11,10,9,0.55)] to-transparent" />
          </div>

          <p
            className="reveal m-0 text-pretty text-xs uppercase leading-[1.75] tracking-[0.04em] text-[var(--gz-ink-200)] lg:[grid-column:2/3] lg:[grid-row:1/2]"
            style={{ transitionDelay: '70ms' }}
          >
            Gorillaz Tattoo Art is a custom tattoo studio based in the Philippines.
            Our resident artists work in realism, black and grey, fine line and
            large-scale blackwork. Most people who sit in our chairs come back for
            a second piece, and that is the only measure of the work we trust.
          </p>

          <p
            className="reveal m-0 text-pretty text-xs uppercase leading-[1.75] tracking-[0.04em] text-[var(--gz-ink-200)] lg:[grid-column:3/4] lg:[grid-row:1/2]"
            style={{ transitionDelay: '140ms' }}
          >
            Every piece is drawn for one person and starts with a consultation,
            never a catalogue. The studio runs on single-use needles, sealed
            sterile tubes and stations set up in front of you — a safe,
            professional environment for a mark you will carry for life.
          </p>

          <div
            className="reveal flex flex-col items-start gap-6 pt-6 sm:col-span-2 lg:[grid-column:2/4] lg:[grid-row:2/3] md:flex-row md:items-end md:justify-between md:pt-18"
            style={{ transitionDelay: '200ms' }}
          >
            <p className="m-0 max-w-[18ch] text-balance text-[7.5vw] font-normal uppercase leading-[0.92] text-[var(--gz-paper-050)] md:text-[3.9vw] [font-family:var(--font-gz-display)]">
              Ready to leave your mark? Book a consultation with the studio.
            </p>
            <CtaPill href={V2_SECTIONS.inquire} className="flex-none self-start md:self-end">
              Inquire now
            </CtaPill>
          </div>
        </div>
      </div>
    </section>
  )
}
