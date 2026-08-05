'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { GalleryItem } from '@/types/gallery'

interface ArtistWorkModalProps {
  open: boolean
  onClose: () => void
  artistLabel: string
  items: GalleryItem[]
}

/**
 * Grid of an artist's pieces, opened from the inquiry form once a visitor
 * picks a preferred artist. Selecting a tile opens a full-view lightbox
 * layered on top (prev/next cycles the same filtered set) — closing the
 * lightbox returns to the grid; closing the grid closes the whole thing.
 */
export function ArtistWorkModal({ open, onClose, artistLabel, items }: ArtistWorkModalProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setActiveIndex(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeIndex !== null) {
          setActiveIndex(null)
        } else {
          onClose()
        }
      } else if (activeIndex !== null && event.key === 'ArrowLeft') {
        setActiveIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length))
      } else if (activeIndex !== null && event.key === 'ArrowRight') {
        setActiveIndex((i) => (i === null ? i : (i + 1) % items.length))
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, activeIndex, items.length, onClose])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  const goPrev = () => setActiveIndex((i) => (i === null ? i : (i - 1 + items.length) % items.length))
  const goNext = () => setActiveIndex((i) => (i === null ? i : (i + 1) % items.length))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${artistLabel}'s portfolio`}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--gz-ink-950)]/90 p-4 backdrop-blur-sm md:p-8"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-[var(--gz-border-subtle)] bg-[var(--gz-ink-950)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--gz-border-subtle)] px-5 py-4 md:px-8">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--gz-ink-400)]">
              Portfolio
            </span>
            <h2 className="m-0 text-lg font-normal capitalize text-[var(--gz-paper-050)] md:text-xl [font-family:var(--font-gz-display)]">
              {artistLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close portfolio"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--gz-border-default)] text-[var(--gz-ink-300)] transition-colors hover:border-[var(--gz-border-strong)] hover:text-[var(--gz-paper-050)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-8">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-[var(--gz-ink-400)]">
              No pieces on file for this artist yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3.5 lg:grid-cols-4">
              {items.map((item, index) => (
                <button
                  key={`${item.piece}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="group relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--gz-ink-900)]"
                >
                  <Image
                    src={item.images[0]}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(11,10,9,0.75)] to-transparent p-2.5 font-mono text-[10px] uppercase tracking-[0.12em] capitalize text-[var(--gz-paper-050)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeIndex !== null && items[activeIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${items[activeIndex].piece} — full view`}
          onClick={(event) => {
            event.stopPropagation()
            setActiveIndex(null)
          }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-full max-w-full flex-col items-center gap-3"
          >
            <div className="relative max-h-[78vh] max-w-[92vw] overflow-hidden rounded-lg">
              <Image
                src={items[activeIndex].images[0]}
                alt={items[activeIndex].alt}
                width={0}
                height={0}
                sizes="92vw"
                className="block h-auto max-h-[78vh] w-auto max-w-[92vw] object-contain"
              />

              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Close full view"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white md:h-10 md:w-10"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous piece"
                    className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white md:h-10 md:w-10"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next piece"
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/90 backdrop-blur transition-colors hover:border-white/40 hover:text-white md:h-10 md:w-10"
                  >
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
              <span className={cn('capitalize')}>{items[activeIndex].category}</span>
              <span aria-hidden>·</span>
              <span>
                {activeIndex + 1} / {items.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
