import { CtaPill } from '@/components/common/CtaPill'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'

/**
 * Full-bleed "Book a consultation" CTA banner for the homepage, shown just
 * before the Footer (wired up in app/(marketing)/page.tsx, since Footer
 * itself lives in the shared marketing layout rather than the page).
 */
export function BookingCta() {
  return (
    <section
      role="region"
      aria-label="Book a tattoo consultation"
      className="relative w-full bg-[var(--gz-ink-900)] py-16 md:py-24"
    >
      <div className="reveal mx-auto flex w-full max-w-[1360px] flex-col gap-10 px-6 md:gap-14 md:px-16">
        <div className="flex flex-col gap-6 md:gap-10">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            Now booking — Santa Rosa, Laguna
          </span>

          <h2 className="m-0 text-[13vw] font-normal uppercase leading-[0.9] tracking-[0.006em] text-[var(--gz-paper-050)] md:text-[6.4vw] [font-family:var(--font-gz-display)]">
            Book a consultation
          </h2>

          <div className="flex flex-col flex-wrap items-start justify-between gap-8 md:flex-row md:items-end">
            <p className="max-w-[40ch] text-[15px] leading-relaxed text-[var(--gz-ink-300)] md:text-base">
              Tell the studio what you want tattooed. We reply within one
              business day with the right resident artist, a scope, a price
              band and the next open date.
            </p>

            <CtaPill href={`${ROUTES.home}${HOME_SECTIONS.inquire}`}>Inquire now</CtaPill>
          </div>
        </div>

        <div className="border-t border-[var(--gz-border-subtle)] pt-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-500)]">
            Consultations · City of Santa Rosa, Laguna
          </span>
        </div>
      </div>
    </section>
  )
}
