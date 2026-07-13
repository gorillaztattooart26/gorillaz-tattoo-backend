import Image from 'next/image'
import { SectionHeading } from '@/components/common/SectionHeading'

interface BeforeAfterPair {
  src: string
  alt: string
}

/**
 * Placeholder pairs — no real before/after healing photos exist yet, and
 * pairing two *different* finished tattoo shots would misrepresent an
 * actual healing progression. Each pair reuses one portfolio photo twice
 * with a different filter treatment on the "before" side (see
 * BEFORE_FILTER below) purely to demonstrate the layout honestly, rather
 * than implying these are real before/after documentation. TODO: replace
 * with genuine before (fresh) / after (healed) photo pairs.
 */
const PAIRS: BeforeAfterPair[] = [
  { src: '/images/portfolio/portfolio-1.jpg', alt: 'blackwork full backpiece tattoo' },
  { src: '/images/portfolio/portfolio-3.jpg', alt: 'fine line grayswash arm sleeve tattoo' },
  { src: '/images/portfolio/portfolio-6.jpg', alt: 'neo traditional chest and sleeve tattoo set' },
]

const BEFORE_FILTER = 'grayscale contrast-75 brightness-90 blur-[1px]'
const AFTER_FILTER = 'grayscale-0'

export function BeforeAfterGallery() {
  return (
    <section aria-label="Before and after tattoo healing" className="relative w-full bg-black px-6 md:px-10 py-16 md:py-20">
      <SectionHeading
        eyebrow="see the difference"
        className="reveal mb-4"
        headingClassName="first-letter:uppercase text-[10vw] md:text-[4.5vw]"
      >
        before &amp; after
      </SectionHeading>
      <p className="reveal mb-10 max-w-xl text-sm leading-relaxed text-white/60 md:mb-14">
        Real client transformations are coming soon — here&apos;s a preview
        of how we&apos;ll show fresh ink next to fully healed work.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PAIRS.map((pair) => (
          <div key={pair.src} className="reveal grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl">
            <figure className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
              <Image
                src={pair.src}
                alt={`before healing — ${pair.alt}`}
                fill
                loading="lazy"
                sizes="(min-width: 768px) 16vw, 50vw"
                className={`object-cover ${BEFORE_FILTER}`}
              />
              <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
                before
              </figcaption>
            </figure>
            <figure className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
              <Image
                src={pair.src}
                alt={`after healing — ${pair.alt}`}
                fill
                loading="lazy"
                sizes="(min-width: 768px) 16vw, 50vw"
                className={`object-cover ${AFTER_FILTER}`}
              />
              <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
                after
              </figcaption>
            </figure>
          </div>
        ))}
      </div>
    </section>
  )
}
