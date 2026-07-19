'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { GalleryItem } from '@/types/gallery'

interface GalleryCardProps {
  item: GalleryItem
  onOpen?: (imageIndex: number) => void
}

/** Single gallery tile. Renders an in-card carousel when a piece has more than one photo. */
export function GalleryCard({ item, onOpen }: GalleryCardProps) {
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
    <figure
      onClick={() => onOpen?.(index)}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5]',
        onOpen && 'cursor-pointer',
      )}
    >
      <Image
        src={item.images[index]}
        alt={item.alt}
        fill
        loading="lazy"
        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur transition-colors hover:bg-black/70"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur transition-colors hover:bg-black/70"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {item.images.map((image, i) => (
              <span
                key={image}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors',
                  i === index ? 'bg-[#fabb42]' : 'bg-white/40',
                )}
              />
            ))}
          </div>
        </>
      )}

      <figcaption className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
        <p className="text-xs capitalize text-white/60">tattooed by {item.artistName}</p>
        <span className="text-white/70 text-xs border border-white/30 rounded-full px-3 py-1 whitespace-nowrap capitalize">
          {item.category}
        </span>
      </figcaption>
    </figure>
  )
}
