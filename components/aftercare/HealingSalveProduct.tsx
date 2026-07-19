import Image from 'next/image'
import { SectionHeading } from '@/components/common/SectionHeading'

const BENEFITS = [
  'Speeds up surface healing',
  'Soothes itching and tightness',
  'Locks in moisture without clogging the skin',
  'Made with skin-safe, fragrance-light ingredients',
]

/** Product feature for the studio's in-house healing balm. */
export function HealingSalveProduct() {
  return (
    <section
      aria-label="Gorillaz Tattoo Balm healing salve"
      className="relative w-full bg-black px-6 md:px-10 py-16 md:py-20"
    >
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="reveal relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
          <Image
            src="/images/products/tattoo-balm.jpg"
            alt="Gorillaz Tattoo Balm healing salve — 50g tin, available exclusively at Gorillaz Tattoo Art studio"
            title="Gorillaz Tattoo Balm healing salve"
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="reveal">
          <SectionHeading eyebrow="the healing salve" headingClassName="first-letter:uppercase text-[10vw] md:text-[4.5vw]">
            gorillaz tattoo balm
          </SectionHeading>

          <p className="mt-6 max-w-md text-[15px] leading-snug text-white/90">
            Our in-house healing salve is formulated specifically for fresh
            tattoos — it soothes irritated skin and helps your ink heal
            faster and cleaner, without clogging the surface.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-white/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fabb42]" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#fabb42]/40 bg-[#fabb42]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#fabb42]">
            available exclusively in-studio · 50g
          </div>
          <p className="mt-3 text-xs text-white/50">
            Not sold online — pick up a tin during your appointment or ask
            your artist about it after your session.
          </p>
        </div>
      </div>
    </section>
  )
}
