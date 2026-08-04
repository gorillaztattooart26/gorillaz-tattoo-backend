'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { V2_SECTIONS } from '@/components/homepage-v2/routes'
import { CtaPill } from '@/components/homepage-v2/CtaPill'
import { FacebookIcon, InstagramIcon } from '@/components/common/icons'
import type { Artist } from '@/types/artist'

interface ArtistsPreviewProps {
  artists: Artist[]
}

// A handful of artists have a wider, more cinematic studio photo shot
// specifically for this design's full-bleed layout, keyed by slug — falls
// back to the artist's regular (tighter-cropped) `src` from the artists
// table, which is framed for the real homepage's bounded card instead.
const V2_PROFILE_PHOTOS: Partial<Record<Artist['slug'], string>> = {
  'park-nichole-lladoc': '/images/homepage-v2/park-lladoc-profile.png',
}

/**
 * /homepage-v2 artist spotlight — one artist shown full-bleed at a time
 * (the v2 design's layout is built for a single artist), with a "next
 * artist" control to cycle through the real `artists` table data instead
 * of being hardcoded to one name. Needs local state to cycle artists, so
 * this is a Client Component; data comes from the Server Component parent
 * (app/homepage-v2/page.tsx) via the same lib/artists.ts getArtists() the
 * real homepage uses.
 */
export function ArtistsPreview({ artists }: ArtistsPreviewProps) {
  const [index, setIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  if (artists.length === 0) return null

  const artist = artists[index % artists.length]
  const v2Photo = V2_PROFILE_PHOTOS[artist.slug]
  const photoSrc = v2Photo ?? artist.src
  // The V2_PROFILE_PHOTOS shots are already wide/cinematic, framed for this
  // full-bleed banner. Artists without one fall back to their regular
  // artists-table photo, which is a portrait crop meant for a bounded card
  // — object-cover-ing that into a ~2:1 banner blows it up and crops in
  // tight on the face. Those get a blurred cover backdrop with the actual
  // photo composited on top via object-contain instead, so the full shot
  // stays visible rather than being zoomed past recognition.
  const isPortraitFallback = !v2Photo

  // Giant name overlay uses a shortened form (first + last word only) —
  // e.g. "Park Nichole Lladoc" -> "Park Lladoc" — matching the design's
  // display treatment, while the bio/alt text keep the artist's full name.
  const displayNameParts = artist.name.trim().split(/\s+/)
  const displayName =
    displayNameParts.length > 2
      ? `${displayNameParts[0]} ${displayNameParts[displayNameParts.length - 1]}`
      : artist.name

  const goNext = () => {
    setIndex((i) => (i + 1) % artists.length)
    if (window.matchMedia('(max-width: 1023px)').matches) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const bioAndLink = (
    <>
      <p className="m-0 w-full text-left text-[15px] leading-relaxed text-[var(--gz-ink-200)] text-pretty md:text-right">
        {artist.bio}
      </p>
      <div className="flex w-full flex-wrap items-end gap-4 md:flex-row-reverse">
        <CtaPill
          href={artist.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${artist.name} on Instagram`}
          className="self-start whitespace-nowrap"
          iconPosition="right"
          iconVariant="default"
        >
          View work
        </CtaPill>
      </div>
    </>
  )

  // Same icon-link pattern as the real homepage's artist section
  // (components/sections/ArtistsPreview.tsx) — layered over the photo
  // instead of sitting in the bio card, since this design's photo is
  // full-bleed rather than a bounded card.
  const socialLinks = (
    <div className="flex items-center gap-2.5">
      <a
        href={artist.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${artist.name} on instagram`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white/80 backdrop-blur transition-colors hover:border-white/50 hover:text-white"
      >
        <InstagramIcon />
      </a>
      <a
        href={artist.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${artist.name} on facebook`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white/80 backdrop-blur transition-colors hover:border-white/50 hover:text-white"
      >
        <FacebookIcon />
      </a>
    </div>
  )

  return (
    <section
      ref={sectionRef}
      id="artists"
      role="region"
      aria-label="Tattoo artists at Gorillaz Tattoo Art studio"
      className="relative w-full overflow-hidden bg-[var(--gz-ink-950)]"
    >
      {/* Mobile: simple stacked layout — heading at the top, the artist
          photo as a normal (non-background) image block, in full colour,
          sitting before the bio. Desktop keeps the original full-bleed
          hero with the giant name overlay, below. */}
      <div className="flex w-full flex-col gap-8 px-6 pb-14 pt-14 md:px-10 lg:hidden">
        <div className="reveal flex w-full flex-col gap-5">
          <h2 className="m-0 max-w-[16ch] text-balance text-[9.5vw] font-normal uppercase leading-[0.9] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]">
            Resident artists
            <br />
            at Gorillaz
            <br />
            Tattoo Art
          </h2>
        </div>

        <div className="reveal relative aspect-[4/3] w-full overflow-hidden">
          <Image
            key={`photo-mobile-${index}`}
            src={photoSrc}
            alt={artist.alt}
            title={`${artist.name} — ${artist.specialty} — gorillaz tattoo art studio`}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 right-4 z-[1]">{socialLinks}</div>
        </div>

        <h3 key={`name-mobile-${index}`} className="m-0 whitespace-nowrap text-left text-[15vw] font-normal uppercase leading-[0.78] tracking-[-0.01em] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)]">
          {displayName}
        </h3>

        <div className="reveal flex w-full flex-col items-start gap-5">{bioAndLink}</div>
      </div>

      {/* Full-bleed background photo, no gutters/rounding — edge to edge */}
      <div className="relative hidden min-h-[min(92svh,940px)] w-full grid-cols-1 items-start lg:grid">
        <div
          aria-hidden="true"
          className="reveal pointer-events-none absolute inset-0 z-[2]"
          style={{
            maskImage:
              'linear-gradient(to bottom, #000 78%, rgba(0,0,0,0.92) 92%, rgba(0,0,0,0.55))',
            WebkitMaskImage:
              'linear-gradient(to bottom, #000 78%, rgba(0,0,0,0.92) 92%, rgba(0,0,0,0.55))',
          }}
        >
          {isPortraitFallback ? (
            <>
              <Image
                key={`photo-blur-${index}`}
                aria-hidden="true"
                src={photoSrc}
                alt=""
                fill
                sizes="100vw"
                className="scale-110 object-cover opacity-60 blur-2xl"
              />
              <Image
                key={`photo-fg-${index}`}
                src={photoSrc}
                alt={artist.alt}
                title={`${artist.name} — ${artist.specialty} — gorillaz tattoo art studio`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </>
          ) : (
            <Image
              key={`photo-${index}`}
              src={photoSrc}
              alt={artist.alt}
              title={`${artist.name} — ${artist.specialty} — gorillaz tattoo art studio`}
              fill
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>

        {/* Social links, layered over the photo bottom-right — the giant
            name overlay below is text-left and rarely reaches the right
            edge, so this corner stays clear of it. */}
        <div className="reveal absolute bottom-[22px] right-6 z-[4] lg:right-10">{socialLinks}</div>

        {/* Heading + bio row */}
        <div className="relative z-[3] flex w-full items-start justify-between gap-8 px-6 pt-14 lg:gap-16 lg:px-10 lg:pt-20">
          <div className="reveal flex w-full max-w-[300px] flex-col gap-5 lg:max-w-[520px] lg:gap-7">
            <h2 className="m-0 max-w-[16ch] text-balance text-[clamp(28px,3.4vw,58px)] font-normal uppercase leading-[0.9] text-[var(--gz-paper-050)] xl:text-[4.6vw] [font-family:var(--font-gz-display)]">
              Resident artists
              <br />
              at Gorillaz
              <br />
              Tattoo Art
            </h2>
          </div>

          <div className="reveal flex w-full max-w-[280px] flex-col items-end gap-6 lg:max-w-[440px] lg:gap-8">{bioAndLink}</div>
        </div>

        {/* Giant name overlay */}
        <h3
          key={`name-${index}`}
          className="pointer-events-none absolute bottom-[17px] left-6 right-0 z-[4] m-0 whitespace-nowrap text-left text-[13vw] font-normal uppercase leading-[0.78] tracking-[-0.01em] text-[var(--gz-paper-050)] lg:left-10 [font-family:var(--font-gz-display)]"
        >
          {displayName}
        </h3>
      </div>

      <div className="reveal relative z-[4] flex flex-col gap-4 border-t border-[var(--gz-border-subtle)] px-6 py-5 md:grid md:grid-cols-3 md:items-center md:gap-4 md:px-10 md:py-[30px]">
        <span className="flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)] md:col-start-1 md:justify-self-start">
          {artist.specialty} · Gorillaz Tattoo Art
        </span>

        {artists.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="flex-none self-start font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-300)] transition-colors hover:text-[var(--gz-paper-050)] md:col-start-2 md:justify-self-center"
          >
            Next artist →
          </button>
        )}

        <a
          href={V2_SECTIONS.process}
          className="flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-300)] transition-colors hover:text-[var(--gz-paper-050)] md:col-start-3 md:justify-self-end"
        >
          How booking works at the studio →
        </a>
      </div>
    </section>
  )
}
