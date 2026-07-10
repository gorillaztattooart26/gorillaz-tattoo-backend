import portfolio1 from '../assets/portfolio-1.jpg'
import portfolio2 from '../assets/portfolio-2.jpg'
import portfolio3 from '../assets/portfolio-3.jpg'
import portfolio4 from '../assets/portfolio-4.jpg'
import portfolio5 from '../assets/portfolio-5.jpg'
import portfolio6 from '../assets/portfolio-6.jpg'

const WORKS = [
  {
    src: portfolio1,
    style: 'blackwork',
    piece: 'full backpiece',
    alt: 'bold blackwork full backpiece tattoo — custom ink design by gorillaz tattoo art studio philippines',
    span: 'md:col-span-2',
  },
  {
    src: portfolio2,
    style: 'bodysuit',
    piece: 'traditional bodysuit',
    alt: 'full body traditional tattoo bodysuit — custom tattoo portfolio, gorillaz tattoo art studio',
    span: '',
  },
  {
    src: portfolio3,
    style: 'fine line',
    piece: 'grayswash sleeve',
    alt: 'fine line grayswash arm sleeve tattoo — custom ink design, gorillaz tattoo art studio philippines',
    span: '',
  },
  {
    src: portfolio4,
    style: 'script',
    piece: 'music bicep script',
    alt: 'custom script music tattoo on bicep — tattoo portfolio, gorillaz tattoo art studio',
    span: '',
  },
  {
    src: portfolio5,
    style: 'portrait',
    piece: 'monochrome study',
    alt: 'monochrome portrait tattoo study — custom ink design by gorillaz tattoo art studio',
    span: '',
  },
  {
    src: portfolio6,
    style: 'neo traditional',
    piece: 'chest & sleeve set',
    alt: 'neo traditional chest and sleeve tattoo set — tattoo portfolio, gorillaz tattoo art studio philippines',
    span: 'md:col-span-2',
  },
]

export default function Portfolio() {
  return (
    <section
      id="portfolio"
      role="region"
      aria-label="Tattoo portfolio — selected custom ink work"
      className="relative w-full bg-black px-6 md:px-10 py-24 md:py-32"
    >
      <div className="reveal flex items-end justify-between gap-6 mb-12 md:mb-16">
        <div>
          <p className="text-xs md:text-sm text-white/70 mb-3">
            tattoo portfolio
          </p>
          <h2 className="hero-title first-letter:uppercase text-white font-medium text-[12vw] md:text-[6vw]">
            selected work
          </h2>
        </div>
        <p className="hidden md:block max-w-[280px] text-[15px] leading-snug text-white/70 pb-2">
          every piece is drawn once, for one body. no flash, no repeats — only
          custom ink design.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        {WORKS.map((work, index) => (
          <figure
            key={work.piece}
            className={`reveal group relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5] md:aspect-auto md:h-[420px] ${work.span}`}
            style={{ transitionDelay: `${(index % 3) * 110}ms` }}
          >
            <img
              src={work.src}
              alt={work.alt}
              title={`${work.style} tattoo — gorillaz tattoo art studio`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <figcaption className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
              <span className="text-white text-sm font-semibold">
                {work.piece}
              </span>
              <span className="text-white/70 text-xs border border-white/30 rounded-full px-3 py-1">
                {work.style}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
