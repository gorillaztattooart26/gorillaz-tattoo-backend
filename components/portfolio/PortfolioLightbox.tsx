'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface LightboxImage {
  src: string
  alt: string
  category: string
  artistName: string
}

interface PortfolioLightboxProps {
  images: LightboxImage[]
  index: number | null
  onIndexChange: (index: number | null) => void
}

/** Minimum horizontal swipe distance (px) to count as a prev/next gesture, not a tap. */
const SWIPE_THRESHOLD = 48

/**
 * Full-screen lightbox for the public /portfolio grid — separate from
 * ArtistWorkModal's own full-view (used from the inquiry form's artist
 * picker) rather than a shared refactor of it, so this task doesn't touch
 * that already-working, unrelated flow. Mirrors its visual language and
 * interaction conventions (same button styles/z-index/backdrop-click/ESC/
 * body-scroll-lock/looping nav) for consistency across the app.
 *
 * `images` is the flat list of every photo across every currently-filtered
 * portfolio piece (a piece with multiple photos contributes one entry per
 * photo) — Previous/Next browse that whole flat list, independent of each
 * tile's own small hover carousel used to choose which photo to open.
 */
export function PortfolioLightbox({ images, index, onIndexChange }: PortfolioLightboxProps) {
  const touchStartX = useRef<number | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const isOpen = index !== null && images[index] !== undefined

  const goPrev = () => onIndexChange(index === null ? null : (index - 1 + images.length) % images.length)
  const goNext = () => onIndexChange(index === null ? null : (index + 1) % images.length)

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onIndexChange(null)
      } else if (event.key === 'ArrowLeft') {
        goPrev()
      } else if (event.key === 'ArrowRight') {
        goNext()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goPrev/goNext close over `index`, which this effect must re-run on anyway
  }, [isOpen, index, images.length])

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  if (!isOpen || index === null) return null

  const current = images[index]

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartX.current
    touchStartX.current = null
    if (startX === null) return
    const endX = event.changedTouches[0]?.clientX ?? startX
    const delta = endX - startX
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    if (delta > 0) {
      goPrev()
    } else {
      goNext()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${current.category} — full view`}
      onClick={() => onIndexChange(null)}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative flex max-h-full max-w-full flex-col items-center gap-3"
      >
        {/*
          Previous/stage/Next as one flex row, where "stage" is a FIXED
          4:5-aspect-ratio box. The width is a pre-computed `min()` of the
          viewport-width budget AND the viewport-height budget converted
          through the 4:5 ratio (`*0.8`) — not `max-w`/`max-h` alone: this
          div is a flex item with no in-flow content (the image inside is
          `fill`, i.e. absolutely positioned, so it contributes nothing to
          the parent's intrinsic size), so `aspect-ratio` + only `max-*`
          constraints resolves to a 0×0 box — there's no definite size on
          either axis for the ratio to apply to. Giving it an explicit,
          already-doubly-capped `width` and letting `aspect-[4/5]` derive
          height from that is what actually produces a non-zero, exactly
          4:5 box on every viewport shape, verified empirically. `fill` +
          `object-contain` scales the image to fit inside that fixed box
          without ever cropping it — a mismatched ratio just letterboxes
          inside the stage, the stage itself never resizes. Previous/Next
          are flex siblings OUTSIDE the
          stage (real layout space, never overlaid on the image), and
          `items-center` centers them against the stage's fixed height
          exactly (metadata lives outside this row, below it, so it can't
          skew that centering). Close sits INSIDE the stage, top-right —
          the stage's `overflow-hidden` is safe here because Close never
          leaves its bounds (unlike the previous outside-the-stage
          placement, which required removing overflow-hidden entirely to
          stay visible).
        */}
        <div className="flex w-full items-center justify-center gap-4 md:gap-5">
          {images.length > 1 && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white md:h-11 md:w-11"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="relative w-[min(calc(100vw-120px),56vh)] aspect-[4/5] overflow-hidden rounded-lg md:w-[min(min(78vw,700px),calc(min(78vh,820px)*0.8))]">
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(min-width: 768px) 62vw, calc(100vw - 120px)"
              className="object-contain"
            />

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => onIndexChange(null)}
              aria-label="Close image viewer"
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white md:h-12 md:w-12"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white md:h-11 md:w-11"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
          <span className="capitalize">{current.category}</span>
          <span aria-hidden>·</span>
          <span className="capitalize">{current.artistName}</span>
          {images.length > 1 && (
            <>
              <span aria-hidden>·</span>
              <span>
                {index + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
