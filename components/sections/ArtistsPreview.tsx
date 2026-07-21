'use client'

import { useState } from 'react'
import Image from 'next/image'
import { SectionHeading } from '@/components/common/SectionHeading'
import { FacebookIcon, InstagramIcon, NextArrowIcon } from '@/components/common/icons'
import type { Artist } from '@/types/artist'

const ARTISTS: Artist[] = [
  {
    slug: 'park-lladoc',
    src: '/images/artists/artist-1.jpg',
    name: 'park nichole lladoc',
    specialty: 'black & grey realism',
    years: '13 yrs',
    bio: 'park is a tattoo artist based in the philippines with over 13 years of professional experience. he specializes in realism, black & grey, and hyper-realism, creating detailed, lifelike tattoos that combine technical precision with artistic expression. his work is known for its depth, realism, and commitment to delivering custom pieces that are both visually striking and deeply personal.',
    instagram: 'https://www.instagram.com/parklladoc/',
    facebook: 'https://www.facebook.com/park.lladoc',
    alt: 'park nichole lladoc — black and grey realism tattoo artist at gorillaz tattoo art studio philippines',
  },
  {
    slug: 'isaiah-recongco',
    src: '/images/artists/artist-2.jpg',
    name: 'isaiah recongco',
    specialty: 'black and grey realism & line art',
    years: '1 year',
    bio: 'specializing in black & grey realism | fine-line & minimalist art. focused on technical shading: whip, pointillism, and pendulum shading. transforming stories into skin art.',
    instagram: 'https://www.instagram.com/justsaiinked/',
    facebook: 'https://www.facebook.com/profile.php?id=61590748843029',
    alt: 'isaiah recongco — black and grey realism and line art tattoo artist at gorillaz tattoo art studio philippines',
  },
]

/**
 * Homepage artist carousel — image / bio+socials / next-artist containers.
 * Needs local state to cycle artists, so this is a Client Component; the
 * eyebrow+heading above it stays static.
 */
export function ArtistsPreview() {
  const [index, setIndex] = useState(0)
  const artist = ARTISTS[index]
  const goNext = () => setIndex((i) => (i + 1) % ARTISTS.length)

  return (
    <section
      id="artists"
      role="region"
      aria-label="Tattoo artists at Gorillaz Tattoo Art studio"
      className="relative w-full px-6 md:px-10 py-24 md:py-32"
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
          key={`img-${index}`}
          className="animate-rise relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5]"
        >
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
