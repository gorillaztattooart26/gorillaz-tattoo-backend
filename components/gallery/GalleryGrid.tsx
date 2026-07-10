'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'
import type { GalleryItem } from '@/types/gallery'

interface GalleryGridProps {
  items: GalleryItem[]
}

/**
 * Category filter + image grid for the full tattoo gallery. Client
 * Component because the active filter is local UI state. Filtered-in
 * figures intentionally skip the global `.reveal` scroll-in animation
 * (that observer only runs once on mount, so it wouldn't pick up items
 * that re-enter the DOM after a filter change) — they just render at
 * full opacity immediately.
 */
export function GalleryGrid({ items }: GalleryGridProps) {
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  )
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredItems =
    activeCategory === 'all' ? items : items.filter((item) => item.category === activeCategory)

  return (
    <div>
      <div className="reveal flex flex-wrap gap-2 mb-10 md:mb-12" role="group" aria-label="Filter by category">
        {categories.map((category) => {
          const isActive = category === activeCategory
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={isActive}
              className={cn(
                'capitalize text-xs md:text-sm rounded-full px-4 py-2 border transition-colors',
                isActive
                  ? 'bg-[#fabb42] border-[#fabb42] text-black font-semibold'
                  : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white',
              )}
            >
              {category}
            </button>
          )
        })}
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-white/60">No pieces found in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filteredItems.map((item) => (
            <figure
              key={item.piece}
              className="group relative overflow-hidden rounded-2xl bg-neutral-900 aspect-[4/5]"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                loading="lazy"
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover grayscale opacity-80 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <figcaption className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-white text-sm font-semibold">{item.piece}</p>
                  <p className="mt-1 text-xs capitalize text-white/60">
                    tattooed by {item.artistName}
                  </p>
                </div>
                <span className="text-white/70 text-xs border border-white/30 rounded-full px-3 py-1 whitespace-nowrap capitalize">
                  {item.category}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
