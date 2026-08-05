'use client'

import Image from 'next/image'
import { useLayoutEffect, useRef } from 'react'
import { ROUTES } from '@/lib/routes'
import { CtaPill } from '@/components/common/CtaPill'
import { cn } from '@/utils/cn'
import type { PortfolioTile } from '@/lib/homepage-media'

interface PortfolioGalleryProps {
  /** The 8 fixed-role tiles (row 1 x3, row 2 x3, anchor, full-bleed reveal), in slot order — see lib/homepage-media.ts. */
  tiles: PortfolioTile[]
}

/** A real portfolio photo, cropped to fill its tile. */
function PhotoTile({
  src,
  alt,
  grayscale,
  className,
  imgClassName,
  sizes = '(min-width: 768px) 33vw, 100vw',
  priority,
}: {
  src: string
  alt: string
  grayscale?: boolean
  className?: string
  imgClassName?: string
  sizes?: string
  priority?: boolean
}) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[var(--gz-ink-800)]', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', imgClassName)}
        style={grayscale ? { filter: 'grayscale(1)' } : undefined}
      />
    </div>
  )
}

/**
 * Homepage gallery preview. The two top rows are a static masonry-style
 * strip; below them, a tall sticky "track" drives a scroll-jacked panel
 * that grows from a small tile into a full-bleed "Portfolio" CTA. No
 * third-party scroll library — a single rAF-throttled scroll listener
 * interpolates the grow panel's box (measured once from the small anchor
 * tile's own layout) and writes directly to refs, so the animation never
 * touches React state/render.
 *
 * Client Component because of that scroll listener; the rest of the
 * homepage stays server-rendered.
 */
export function PortfolioGallery({ tiles }: PortfolioGalleryProps) {
  const row1 = tiles.slice(0, 3)
  const row2 = tiles.slice(3, 6)
  const anchorTile = tiles[6]
  const growTile = tiles[7]

  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const growRef = useRef<HTMLDivElement>(null)
  const growImgRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  // useLayoutEffect (not useEffect) — measures and positions the grow
  // panel synchronously before the browser paints. With useEffect there
  // was a one-frame window where `grow` had no inline position yet
  // (defaulting to top:auto/left:auto), which could render it briefly
  // misaligned from the anchor tile it's supposed to exactly overlay.
  useLayoutEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const anchor = anchorRef.current
    const grow = growRef.current
    if (!track || !stage || !anchor || !grow) return

    let anchorBox = { left: 0, top: 0, width: 0, height: 0 }
    let raf = 0

    const measureAnchor = () => {
      const stageRect = stage.getBoundingClientRect()
      const anchorRect = anchor.getBoundingClientRect()
      anchorBox = {
        left: anchorRect.left - stageRect.left,
        top: anchorRect.top - stageRect.top,
        width: anchorRect.width,
        height: anchorRect.height,
      }
    }

    const lerp = (from: number, to: number, t: number) => from + (to - from) * t
    // ease-out cubic — matches the design's cubic-bezier(0.22,1,0.36,1) feel closely enough for a linear-to-eased remap
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)

    const update = () => {
      raf = 0
      const trackRect = track.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const isMobile = window.matchMedia('(max-width: 767px)').matches

      let rawProgress: number
      if (isMobile) {
        // Mobile stacks tile 8 (the last image) above tile 7's grow panel
        // instead of side by side. Once the pin engages (tiles flush at
        // the top), start growing immediately — no extra scroll delay.
        const scrolledPastTrackTop = Math.max(0, -trackRect.top)
        const scrollable = trackRect.height - viewportHeight
        rawProgress = scrollable > 0 ? scrolledPastTrackTop / scrollable : 0
      } else {
        // Desktop: waiting until the track's top actually reaches the
        // viewport top (the sticky pin point) starts the grow animation
        // only once the tiles are already flush against the top edge.
        // Instead, start counting a half-viewport early — while the tiles
        // are still scrolling up through the middle of the view, pre-pin —
        // so growth is already underway by the time they lock into place.
        const lead = viewportHeight * 0.5
        const scrolledPastTrackTop = Math.max(0, lead - trackRect.top)
        const scrollable = trackRect.height - viewportHeight + lead
        rawProgress = scrollable > 0 ? scrolledPastTrackTop / scrollable : 0
      }
      const progress = Math.min(1, Math.max(0, rawProgress))
      const t = ease(progress)

      const stageRect = stage.getBoundingClientRect()
      const left = lerp(anchorBox.left, 0, t)
      const top = lerp(anchorBox.top, 0, t)
      const width = lerp(anchorBox.width, stageRect.width, t)
      const height = lerp(anchorBox.height, stageRect.height, t)

      grow.style.left = `${left}px`
      grow.style.top = `${top}px`
      grow.style.width = `${width}px`
      grow.style.height = `${height}px`

      if (growImgRef.current) {
        growImgRef.current.style.filter = `grayscale(${1 - t}) contrast(1.06)`
      }
      if (scrimRef.current) {
        scrimRef.current.style.opacity = `${Math.min(1, t * 1.4)}`
      }

      const copyT = Math.min(1, Math.max(0, (progress - 0.55) / 0.4))
      if (headRef.current) {
        headRef.current.style.opacity = `${copyT}`
        headRef.current.style.transform = `translateY(${(1 - copyT) * 24}px)`
      }
      if (linkRef.current) {
        linkRef.current.style.opacity = `${copyT}`
        linkRef.current.style.transform = `translateY(${(1 - copyT) * 16}px)`
        linkRef.current.style.pointerEvents = copyT > 0.5 ? 'auto' : 'none'
      }
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    const onResize = () => {
      measureAnchor()
      onScroll()
    }

    measureAnchor()
    update()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section
      id="work"
      role="region"
      aria-label="Tattoo portfolio — selected custom ink work"
      className="relative w-full py-16 md:py-24"
    >
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-2 md:gap-3 px-6 md:px-16">
        <div className="reveal mb-2.5 flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--gz-border-subtle)] pb-4 md:mb-5 md:pb-5">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)]">
            Studio portfolio
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
            Selected work
          </span>
        </div>

        {/* Row 1 gets a bespoke mobile order: tiles 1 & 3 sit side by side,
            tile 2 drops full-width underneath. Desktop keeps the original
            flex-wrap masonry row untouched via md:flex. */}
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3.5">
          {row1.map((tile, tileIndex) => (
            <div
              key={tile.slot}
              className={cn(
                'reveal min-w-0',
                tileIndex === 1 && 'order-3 col-span-2 md:order-none md:col-span-1',
                tileIndex === 2 && 'order-2 md:order-none',
              )}
              style={{
                flex: `${tile.ratio} 1 calc(${tile.ratio} * 132px)`,
                aspectRatio: tile.ratio,
                transitionDelay: `${tileIndex * 70}ms`,
              }}
            >
              <PhotoTile
                src={tile.src}
                alt={tile.alt}
                grayscale={tile.grayscale}
                className="h-full w-full"
                priority={tileIndex === 0}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3.5">
          {row2.map((tile, tileIndex) => (
            <div
              key={tile.slot}
              className="reveal min-w-0"
              style={{
                flex: `${tile.ratio} 1 calc(${tile.ratio} * 132px)`,
                aspectRatio: tile.ratio,
                transitionDelay: `${tileIndex * 70}ms`,
              }}
            >
              <PhotoTile src={tile.src} alt={tile.alt} grayscale={tile.grayscale} className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Scroll-jacked growing panel — a tall spacer + sticky stage.
          items-start (not items-center) + a top pad matching the row gap
          above keeps this row flush under row 2 instead of floating
          vertically centered in the full-viewport-height sticky stage. */}
      <div ref={trackRef} className="relative mt-2 md:mt-3.5 h-[225svh]">
        <div
          ref={stageRef}
          className="sticky top-0 flex h-svh items-start overflow-hidden pt-2 md:pt-3.5"
        >
          {/* Tile 8 stacks above tile 7 on mobile instead of sitting
              side by side — mirrors the row-1 mobile layout above. */}
          <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-2 px-6 md:flex-row md:gap-3.5 md:px-16">
            <div
              ref={anchorRef}
              className="order-2 w-full md:order-none md:w-auto"
              style={{ flex: '1.68 1 calc(1.68 * 132px)', aspectRatio: 1.68 }}
            />
            <div
              className="reveal order-1 min-w-0 w-full md:order-none md:w-auto"
              style={{ flex: '1.34 1 calc(1.34 * 132px)', aspectRatio: 1.34 }}
            >
              <PhotoTile src={anchorTile.src} alt={anchorTile.alt} className="h-full w-full" />
            </div>
          </div>

          <div ref={growRef} className="absolute z-[2] overflow-hidden bg-[var(--gz-ink-900)]">
            <div ref={growImgRef} className="absolute inset-0" style={{ filter: 'grayscale(1) contrast(1.06)' }}>
              <PhotoTile
                src={growTile.src}
                alt={growTile.alt}
                className="h-full w-full"
                imgClassName="object-[35%_50%] md:object-center"
                // This tile grows into a full-bleed panel that's much taller than
                // it is wide on mobile — a portrait crop of a landscape source
                // photo. `sizes` only ever describes the display *width*, so a
                // viewport-width-based value (the PhotoTile default) picks a
                // srcset bucket sized for a much shorter box, and object-cover
                // then has to upscale it well past its native resolution to
                // fill the height, reading as pixelated. Requesting a fixed
                // width larger than the source's own (1672px) forces Next to
                // always serve the full-resolution original instead.
                sizes="1672px"
              />
            </div>
            <div
              ref={scrimRef}
              className="pointer-events-none absolute inset-0 opacity-0"
              style={{
                background:
                  'linear-gradient(to left, rgba(11,10,9,0.66), rgba(11,10,9,0.16) 56%, rgba(11,10,9,0) 84%)',
              }}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 z-[3] flex flex-col items-end justify-center gap-6 px-6 py-0 md:gap-10 md:px-26">
            <h2
              ref={headRef}
              className="m-0 text-right text-[16vw] font-normal uppercase leading-[0.84] text-[var(--gz-paper-050)] opacity-0 md:text-[11vw] [font-family:var(--font-gz-display)]"
            >
              Portfolio
            </h2>
            <CtaPill
              as="link"
              ref={linkRef}
              href={ROUTES.portfolio}
              className="pointer-events-none opacity-0"
              transition="colors"
            >
              View now
            </CtaPill>
          </div>
        </div>
      </div>
    </section>
  )
}
