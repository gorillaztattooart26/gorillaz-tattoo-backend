import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/common/SectionHeading'
import { ROUTES } from '@/lib/routes'
import type { PortfolioWork } from '@/types/portfolio'

const WORKS: PortfolioWork[] = [
  {
    src: '/images/portfolio/portfolio-50.jpg',
    style: 'hyper-realism',
    piece: 'hannya mask flame leg sleeve',
    alt: 'hyper-realistic hannya mask and flames leg sleeve tattoo — custom ink design by gorillaz tattoo art studio philippines',
    span: 'md:col-span-2',
  },
  {
    src: '/images/portfolio/portfolio-19.jpg',
    style: 'blackwork',
    piece: 'guardian angel leg sleeve',
    alt: 'black and grey guardian angel leg sleeve tattoo — custom tattoo portfolio, gorillaz tattoo art studio',
  },
  {
    src: '/images/portfolio/portfolio-75.jpg',
    style: 'realism',
    piece: 'wasteland portrait sleeve',
    alt: 'realism portrait tattoo with burning cityscape reflection — custom ink design, gorillaz tattoo art studio philippines',
  },
  {
    src: '/images/portfolio/portfolio-79.jpg',
    style: 'japanese',
    piece: 'blue dragon leg sleeve',
    alt: 'traditional japanese blue dragon leg sleeve tattoo — tattoo portfolio, gorillaz tattoo art studio',
  },
  {
    src: '/images/portfolio/portfolio-105.jpg',
    style: 'neo traditional',
    piece: 'tiger & serpent forearm',
    alt: 'neo traditional tiger and serpent forearm tattoo — custom ink design by gorillaz tattoo art studio',
  },
  {
    src: '/images/portfolio/portfolio-14.jpg',
    style: 'anime',
    piece: 'nine-tailed fox side piece',
    alt: 'anime nine-tailed fox side piece tattoo — tattoo portfolio, gorillaz tattoo art studio philippines',
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
      className="relative w-full px-6 md:px-10 py-24 md:py-32"
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
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
