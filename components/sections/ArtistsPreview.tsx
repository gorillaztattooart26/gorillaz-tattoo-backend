'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { SectionHeading } from '@/components/common/SectionHeading'
import { FacebookIcon, InstagramIcon, NextArrowIcon } from '@/components/common/icons'
import type { Artist } from '@/types/artist'

interface ArtistsPreviewProps {
  artists: Artist[]
}

/**
 * Homepage artist carousel — image / bio+socials / next-artist containers.
 * Needs local state to cycle artists, so this is a Client Component; the
 * eyebrow+heading above it stays static. Artist data comes from the
 * `artists` table (fetched by the Server Component parent) so staff can
 * edit it from /staff/artists instead of it being hardcoded here.
 */
export function ArtistsPreview({ artists }: ArtistsPreviewProps) {
  const [index, setIndex] = useState(0)
  const photoRef = useRef<HTMLElement>(null)

  if (artists.length === 0) return null

  const artist = artists[index % artists.length]

  const goNext = () => {
    setIndex((i) => (i + 1) % artists.length)
    // On mobile the card stack is tall enough that the button sits well
    // below the artist's photo — without this, switching artists leaves
    // the photo/bio off-screen above the visitor instead of showing the
    // new artist from the top like a fresh card.
    if (window.matchMedia('(max-width: 767px)').matches) {
      photoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      id="artists"
      role="region"
      aria-label="Tattoo artists at Gorillaz Tattoo Art studio"
      className="relative w-full scroll-mt-28 px-6 md:px-10 py-24 md:py-32"
    >
      <SectionHeading
        eyebrow="the crew"
        className="reveal mb-12 md:mb-16"
        headingClassName="first-letter:uppercase text-[12vw] md:text-[6vw]"
      >
        resident artists
      </SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4 items-stretch">
        <figure
          ref={photoRef}
          className="relative scroll-mt-28 overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5]"
        >
          {/* Keyed on index (not the outer figure) so the rise animation
              replays on every artist change while the figure itself stays
              mounted — scrollIntoView targets the figure, and a smooth
              scroll gets cancelled by the browser if its target is
              unmounted mid-animation, which a keyed figure would do. */}
          <div key={`img-${index}`} className="animate-rise absolute inset-0">
            <Image
              src={artist.src}
              alt={artist.alt}
              title={`${artist.name} — ${artist.specialty} — gorillaz tattoo art studio`}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <span className="absolute top-5 right-5 text-white/80 text-xs border border-white/30 rounded-full px-3 py-1 whitespace-nowrap backdrop-blur">
              {artist.years}
            </span>
          </div>
        </figure>

        <div
          key={`bio-${index}`}
          className="animate-rise flex flex-col justify-center gap-4 rounded-2xl bg-neutral-900/50 p-8"
        >
          <div>
            <h3 className="hero-title first-letter:uppercase text-white font-medium text-[7vw] md:text-[2.4vw]">
              {artist.name}
            </h3>
            <p className="mt-2 text-sm text-white/70">{artist.specialty}</p>
          </div>
          <p className="text-[15px] leading-relaxed text-white/60">{artist.bio}</p>
          <div className="flex items-center gap-3 mt-1">
            <a
              href={artist.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${artist.name} on instagram`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            >
              <InstagramIcon />
            </a>
            <a
              href={artist.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${artist.name} on facebook`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Show next artist"
          className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/15 bg-neutral-900/30 py-10 md:py-0 hover:border-white/30 hover:bg-neutral-900/60 transition-colors"
        >
          <span className="flex items-center gap-2 text-white text-sm font-semibold uppercase tracking-wide">
            next artist
            <NextArrowIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </section>
  )
}
