import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/common/SectionHeading'
import { ROUTES } from '@/lib/routes'
import type { PortfolioWork } from '@/types/portfolio'

const WORKS: PortfolioWork[] = [
  {
    src: '/images/portfolio/portfolio-1.jpg',
    style: 'blackwork',
    piece: 'full backpiece',
    alt: 'bold blackwork full backpiece tattoo — custom ink design by gorillaz tattoo art studio philippines',
    span: 'md:col-span-2',
  },
  {
    src: '/images/portfolio/portfolio-2.jpg',
    style: 'bodysuit',
    piece: 'traditional bodysuit',
    alt: 'full body traditional tattoo bodysuit — custom tattoo portfolio, gorillaz tattoo art studio',
  },
  {
    src: '/images/portfolio/portfolio-3.jpg',
    style: 'fine line',
    piece: 'grayswash sleeve',
    alt: 'fine line grayswash arm sleeve tattoo — custom ink design, gorillaz tattoo art studio philippines',
  },
  {
    src: '/images/portfolio/portfolio-4.jpg',
    style: 'script',
    piece: 'music bicep script',
    alt: 'custom script music tattoo on bicep — tattoo portfolio, gorillaz tattoo art studio',
  },
  {
    src: '/images/portfolio/portfolio-5.jpg',
    style: 'portrait',
    piece: 'monochrome study',
    alt: 'monochrome portrait tattoo study — custom ink design by gorillaz tattoo art studio',
  },
  {
    src: '/images/portfolio/portfolio-6.jpg',
    style: 'neo traditional',
    piece: 'chest & sleeve set',
    alt: 'neo traditional chest and sleeve tattoo set — tattoo portfolio, gorillaz tattoo art studio philippines',
    span: 'md:col-span-2',
  },
]

/**
 * Homepage portfolio preview grid. Pairs with the future dedicated
 * `/portfolio` page, which will show the full gallery. Server Component.
 */
export function PortfolioPreview() {
  return (
    <section
      id="portfolio"
      role="region"
      aria-label="Tattoo portfolio — selected custom ink work"
      className="relative w-full bg-black px-6 md:px-10 py-24 md:py-32"
    >
      <div className="reveal flex items-end justify-between gap-6 mb-12 md:mb-16">
        <SectionHeading eyebrow="tattoo portfolio" headingClassName="first-letter:uppercase text-[12vw] md:text-[6vw]">
          selected work
        </SectionHeading>
        <p className="hidden md:block max-w-[280px] text-[15px] leading-snug text-white/70 pb-2">
          every piece is drawn once, for one body. no flash, no repeats — only
          custom ink design.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        {WORKS.map((work, index) => (
          <figure
            key={work.piece}
            className={`reveal group relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5] md:aspect-auto md:h-[420px] ${work.span ?? ''}`}
            style={{ transitionDelay: `${(index % 3) * 110}ms` }}
          >
            <Image
              src={work.src}
              alt={work.alt}
              title={`${work.style} tattoo — gorillaz tattoo art studio`}
              fill
              loading="lazy"
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover grayscale opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <figcaption className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
              <span className="text-white text-sm font-semibold">{work.piece}</span>
              <span className="text-white/70 text-xs border border-white/30 rounded-full px-3 py-1">
                {work.style}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="reveal mt-10 flex justify-center md:mt-14">
        <Link
          href={ROUTES.gallery}
          className="rounded-full bg-[#fabb42] px-8 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
        >
          view gallery
        </Link>
      </div>
    </section>
  )
}
