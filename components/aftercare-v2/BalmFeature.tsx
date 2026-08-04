import Image from 'next/image'

const BULLETS = [
  'Speeds up surface healing',
  'Soothes itching and tightness',
  'Locks in moisture without clogging skin',
  'Skin-safe, fragrance-light ingredients',
]

/**
 * Split image/copy feature for the in-house healing balm. Reuses the same
 * product photo as the production Aftercare page's HealingSalveProduct
 * (components/aftercare/HealingSalveProduct.tsx), styled per the handoff
 * (square crop, contrast/saturate filter, bottom gradient).
 */
export function BalmFeature() {
  return (
    <section
      role="region"
      aria-label="Gorillaz tattoo balm"
      className="relative w-full overflow-hidden bg-[var(--gz-ink-900)] py-[clamp(56px,8vw,116px)]"
    >
      <div className="relative mx-auto flex w-full max-w-[1360px] flex-wrap items-center gap-[clamp(28px,4vw,80px)] px-6 md:px-16">
        <div className="reveal relative aspect-square min-w-[min(100%,340px)] flex-1 overflow-hidden bg-[var(--gz-ink-950)]">
          <Image
            src="/images/products/tattoo-balm.jpg"
            alt="Gorillaz Tattoo Balm healing salve — 50g tin, available exclusively at Gorillaz Tattoo Art studio"
            title="Gorillaz Tattoo Art — healing balm"
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover [filter:contrast(1.04)_saturate(1.04)]"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(11,10,9,0.5),transparent_55%)]" />
        </div>

        <div className="reveal flex min-w-[min(100%,360px)] flex-1 flex-col gap-[clamp(16px,2vw,26px)]">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            The healing salve
          </span>
          <h2 className="m-0 text-[clamp(32px,4.6vw,72px)] font-normal uppercase leading-[0.92] tracking-[0.008em] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]">
            Gorillaz tattoo balm
          </h2>
          <p className="m-0 max-w-[46ch] text-pretty text-[clamp(14px,1.05vw,17px)] leading-relaxed text-[var(--gz-ink-200)]">
            Our in-house salve is made for fresh tattoos — it settles
            irritated skin and helps ink heal faster and cleaner without
            clogging the surface.
          </p>

          <div className="mt-0.5 flex flex-col gap-0.5">
            {BULLETS.map((bullet, index) => (
              <div
                key={bullet}
                className={
                  index === BULLETS.length - 1
                    ? 'flex items-baseline gap-3 border-y border-[var(--gz-border-subtle)] py-3'
                    : 'flex items-baseline gap-3 border-t border-[var(--gz-border-subtle)] py-3'
                }
              >
                <span className="h-[5px] w-[5px] flex-none rounded-full bg-[var(--gz-copper-500)]" />
                <span className="text-sm text-[var(--gz-ink-200)]">{bullet}</span>
              </div>
            ))}
          </div>

          <div className="mt-0.5 flex flex-col gap-2.5">
            <span className="self-start rounded-[var(--gz-radius-pill)] border border-[var(--gz-copper-500)] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
              In-studio only · 50g
            </span>
            <p className="m-0 max-w-[52ch] text-[13px] leading-relaxed text-[var(--gz-ink-400)]">
              Not sold online — pick up a tin at your appointment, or ask
              your artist for one after your session.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
