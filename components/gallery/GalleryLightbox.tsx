'use client'

import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryItem } from '@/types/gallery'

interface GalleryLightboxProps {
  items: GalleryItem[]
  itemIndex: number
  imageIndex: number
  onClose: () => void
  onNavigate: (itemIndex: number) => void
}

/** Fullscreen photo viewer opened from a gallery card, with prev/next stepping through the current filtered set. */
export function GalleryLightbox({ items, itemIndex, imageIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const item = items[itemIndex]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onNavigate((itemIndex - 1 + items.length) % items.length)
      if (event.key === 'ArrowRight') onNavigate((itemIndex + 1) % items.length)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [itemIndex, items.length, onClose, onNavigate])

  if (!item) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-w-[95vw] items-center justify-center gap-3 md:gap-6"
      >
        <button
          type="button"
          onClick={() => onNavigate((itemIndex - 1 + items.length) % items.length)}
          aria-label="Previous piece"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex max-h-[90vh] max-w-[75vw] flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- lightbox needs intrinsic sizing, not next/image's fixed layout */}
          <img
            src={item.images[imageIndex] ?? item.images[0]}
            alt={item.alt}
            className="max-h-[78vh] max-w-[75vw] rounded-lg object-contain"
          />
          <div className="text-center">
            <p className="text-white text-sm font-semibold">{item.piece}</p>
            <p className="mt-1 text-xs capitalize text-white/60">tattooed by {item.artistName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate((itemIndex + 1) % items.length)}
          aria-label="Next piece"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
