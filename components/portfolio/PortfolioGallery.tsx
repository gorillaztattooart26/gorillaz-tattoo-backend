'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'
import { CtaPill } from '@/components/common/CtaPill'
import { cn } from '@/utils/cn'
import { artistNameKey } from '@/utils/artistName'
import type { GalleryItem } from '@/types/gallery'

interface PortfolioGalleryProps {
  items: GalleryItem[]
}

/**
 * Single masonry tile. Pieces with more than one reference photo (e.g. a
 * healed shot alongside the fresh one) get an in-tile carousel.
 */
function PortfolioTile({ item }: { item: GalleryItem }) {
  const [index, setIndex] = useState(0)
  const hasMultiple = item.images.length > 1

  const goPrev = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIndex((i) => (i - 1 + item.images.length) % item.images.length)
  }

  const goNext = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIndex((i) => (i + 1) % item.images.length)
  }

  return (
    <div className="group relative mb-2.5 break-inside-avoid overflow-hidden bg-[var(--gz-ink-900)] md:mb-3.5">
      <Image
        src={item.images[index]}
        alt={item.alt}
        width={0}
        height={0}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="block h-auto w-full transition-transform duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
        style={{ filter: 'contrast(1.03) saturate(1.02)' }}
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--gz-border-default)] bg-[var(--gz-ink-950)]/70 text-[var(--gz-paper-050)] opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 hover:border-[var(--gz-border-strong)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--gz-border-default)] bg-[var(--gz-ink-950)]/70 text-[var(--gz-paper-050)] opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 hover:border-[var(--gz-border-strong)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="pointer-events-none absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {item.images.map((image, i) => (
              <span
                key={image}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  i === index ? 'bg-[var(--gz-copper-500)]' : 'bg-[var(--gz-paper-050)]/40',
                )}
              />
            ))}
          </div>
        </>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-[rgba(11,10,9,0.72)] to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] capitalize text-[var(--gz-paper-050)]">
          {item.category}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] capitalize text-[var(--gz-copper-300)]">
          {item.artistName}
        </span>
      </div>
    </div>
  )
}

/**
 * Filterable portfolio grid for /portfolio. Client Component because the
 * artist/category filters and the category rail's scroll-to-center
 * behaviour are local UI state. Filtered tiles deliberately skip the
 * global `.reveal` scroll-in animation since that observer only runs once
 * on mount and wouldn't pick up tiles that re-enter the DOM after a filter
 * change.
 */
export function PortfolioGallery({ items }: PortfolioGalleryProps) {
  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  )
  const artists = useMemo(
    () => ['All', ...Array.from(new Set(items.map((item) => item.artistName)))],
    [items],
  )

  // Deep link from the homepage's "View work" button, e.g. /portfolio?artist=park-lladoc.
  // Resolved synchronously in useState's lazy initializer rather than an effect, so the
  // correct filter is active from the very first render (no flash of "All" first) and the
  // match can't be skipped by an unrelated re-render — an effect-based version of this
  // was found to occasionally miss re-applying across client-side navigations in local dev
  // (React Strict Mode double-invokes effects; production builds were unaffected either way).
  const searchParams = useSearchParams()
  const artistQuery = searchParams.get('artist')
  const [category, setCategory] = useState('All')
  const [artist, setArtist] = useState(() => {
    if (!artistQuery) return 'All'
    const targetKey = artistNameKey(artistQuery)
    return artists.find((label) => label !== 'All' && artistNameKey(label) === targetKey) ?? 'All'
  })
  const railRef = useRef<HTMLDivElement>(null)
  const categoryTrackRef = useRef<HTMLDivElement>(null)
  const [railPad, setRailPad] = useState({ start: 0, end: 0 })

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === 'All' || item.category === category) &&
          (artist === 'All' || item.artistName === artist),
      ),
    [items, category, artist],
  )

  // Pads the scrollable rail so "All" (the first pill) sits centered in the
  // viewport at rest, and the last pill can also reach center — mirrors the
  // Claude Design handoff's own measurePads() behaviour. Recomputed on
  // resize since the centering offset depends on the rail's viewport width.
  useLayoutEffect(() => {
    const rail = railRef.current
    const track = categoryTrackRef.current
    if (!rail || !track) return

    const measure = () => {
      const buttons = track.querySelectorAll('button')
      if (!buttons.length) return
      const first = buttons[0] as HTMLElement
      const last = buttons[buttons.length - 1] as HTMLElement
      setRailPad({
        start: Math.max(0, Math.round(rail.clientWidth / 2 - first.offsetWidth / 2)),
        end: Math.max(0, Math.round(rail.clientWidth / 2 - last.offsetWidth / 2)),
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [categories])

  const pickCategory = (label: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setCategory(label)
    const rail = railRef.current
    const btn = event.currentTarget
    if (rail) {
      rail.scrollTo({
        left: btn.offsetLeft + btn.offsetWidth / 2 - rail.clientWidth / 2,
        behavior: 'smooth',
      })
    }
  }

  const reset = () => {
    setCategory('All')
    setArtist('All')
  }

  const activeLabel = `${category === 'All' ? 'All styles' : category} · ${artist === 'All' ? 'all artists' : artist}`
  const countLabel = filtered.length === 1 ? '1 piece' : `${filtered.length} pieces`

  return (
    <section
      id="portfolio"
      aria-label="Tattoo portfolio — filterable gallery"
      className="pt-[124px] pb-16 md:pt-[160px] md:pb-24 lg:pt-[196px] lg:pb-[132px]"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-7 px-6 md:gap-9 md:px-10 lg:gap-12">
        <div className="reveal flex flex-col items-center gap-4 md:gap-6">
          <h1 className="m-0 text-center text-[56px] font-normal uppercase leading-[0.86] tracking-[0.02em] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)] md:text-[104px] lg:text-[176px]">
            Portfolio
          </h1>
          <p className="m-0 max-w-[46ch] text-center text-sm leading-relaxed text-[var(--gz-ink-300)] md:text-base">
            Healed and fresh work from the studio floor. Filter by style, or scroll the whole book.
          </p>
        </div>

        <div className="reveal flex flex-col items-center gap-2 md:gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--gz-ink-400)]">
            Artist
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-6">
            {artists.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setArtist(label)}
                aria-pressed={label === artist}
                className={cn(
                  'border-b py-1 font-mono text-[11px] uppercase tracking-[0.14em] capitalize transition-colors',
                  label === artist
                    ? 'border-[var(--gz-copper-500)] text-[var(--gz-paper-050)]'
                    : 'border-transparent text-[var(--gz-ink-400)] hover:text-[var(--gz-paper-050)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={railRef}
          className="reveal relative overflow-x-auto overflow-y-hidden [mask-image:linear-gradient(to_right,transparent,#000_4%,#000_96%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max min-w-full flex-nowrap items-stretch">
            <span aria-hidden className="flex-none" style={{ width: railPad.start }} />
            <div
              ref={categoryTrackRef}
              className="flex flex-nowrap gap-3.5 border-t border-[var(--gz-border-subtle)] px-1 md:gap-8"
            >
              {categories.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={(event) => pickCategory(label, event)}
                  aria-pressed={label === category}
                  className="flex flex-none flex-col items-center gap-2 whitespace-nowrap"
                >
                  <span
                    className={cn(
                      'h-[22px] w-px',
                      label === category ? 'bg-[var(--gz-copper-500)]' : 'bg-[var(--gz-border-subtle)]',
                    )}
                  />
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 pb-1 font-mono text-[11px] uppercase tracking-[0.14em] capitalize',
                      label === category ? 'text-[var(--gz-paper-050)]' : 'text-[var(--gz-ink-400)]',
                    )}
                  >
                    <span
                      className={cn(
                        'h-[5px] w-[5px] rounded-full',
                        label === category ? 'bg-[var(--gz-copper-500)]' : 'bg-[var(--gz-ink-700)]',
                      )}
                    />
                    {label}
                  </span>
                </button>
              ))}
            </div>
            <span aria-hidden className="flex-none" style={{ width: railPad.end }} />
          </div>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
          <span>{activeLabel}</span>
          <span>{countLabel}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-5 border-y border-[var(--gz-border-subtle)] px-6 py-16 text-center md:py-28">
            <p className="m-0 max-w-[40ch] text-base leading-relaxed text-[var(--gz-ink-300)]">
              No work in this combination yet.
            </p>
            <button
              type="button"
              onClick={reset}
              className="border-b border-[var(--gz-copper-500)] py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--gz-copper-300)]"
            >
              Show all styles
            </button>
          </div>
        ) : (
          <div className="columns-1 gap-2.5 md:columns-2 md:gap-3.5 lg:columns-3">
            {filtered.map((item) => (
              <PortfolioTile key={item.piece} item={item} />
            ))}
          </div>
        )}

        <div className="reveal mt-3 flex flex-col items-center gap-5 border-t border-[var(--gz-border-subtle)] pt-9 md:mt-7 md:gap-6 md:pt-16">
          <p className="m-0 max-w-[22ch] text-center text-[28px] font-normal uppercase leading-[0.94] text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)] md:text-[48px] lg:text-[64px]">
            Found the one you want on your skin?
          </p>
          <CtaPill as="link" href={`${ROUTES.home}${HOME_SECTIONS.inquire}`} className="tracking-[0.01em]">
            Inquire now
          </CtaPill>
        </div>
      </div>
    </section>
  )
}
