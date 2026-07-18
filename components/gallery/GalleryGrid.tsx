'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { GalleryCard } from '@/components/gallery/GalleryCard'
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox'
import type { GalleryItem } from '@/types/gallery'

interface GalleryGridProps {
  items: GalleryItem[]
}

/**
 * Category filter + artist filter + image grid for the full tattoo
 * gallery. Client Component because the active filters and lightbox are
 * local UI state. Filtered-in figures intentionally skip the global
 * `.reveal` scroll-in animation (that observer only runs once on mount,
 * so it wouldn't pick up items that re-enter the DOM after a filter
 * change) — they just render at full opacity immediately.
 */
export function GalleryGrid({ items }: GalleryGridProps) {
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  )
  const artists = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.artistName)))],
    [items],
  )
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeArtist, setActiveArtist] = useState('all')
  const [isArtistMenuOpen, setIsArtistMenuOpen] = useState(false)
  const artistMenuRef = useRef<HTMLDivElement>(null)

  const [lightbox, setLightbox] = useState<{ itemIndex: number; imageIndex: number } | null>(null)

  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const matchesArtist = activeArtist === 'all' || item.artistName === activeArtist
    return matchesCategory && matchesArtist
  })

  // Filters changed underneath an open lightbox — its index no longer points at the same piece, so close it.
  useEffect(() => {
    setLightbox(null)
  }, [activeCategory, activeArtist])

  useEffect(() => {
    if (!isArtistMenuOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (artistMenuRef.current && !artistMenuRef.current.contains(event.target as Node)) {
        setIsArtistMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isArtistMenuOpen])

  return (
    <div>
      <div ref={artistMenuRef} className="reveal mb-10 flex flex-col gap-4 md:mb-12">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter gallery">
          <button
            type="button"
            onClick={() => setIsArtistMenuOpen((open) => !open)}
            aria-expanded={isArtistMenuOpen}
            aria-haspopup="true"
            className={cn(
              'flex items-center gap-1.5 text-xs md:text-sm rounded-full px-4 py-2 border transition-colors capitalize',
              activeArtist !== 'all'
                ? 'bg-[#fabb42] border-[#fabb42] text-black font-semibold'
                : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white',
            )}
          >
            {activeArtist === 'all' ? 'artist' : activeArtist}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isArtistMenuOpen && 'rotate-180')} />
          </button>

          <span className="h-6 w-px shrink-0 bg-white/15" aria-hidden="true" />

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

        {isArtistMenuOpen && (
          <div
            role="menu"
            aria-label="Filter by artist"
            className="inline-flex w-fit flex-wrap gap-2 rounded-xl border border-white/15 bg-neutral-900/60 p-4"
          >
            {artists.map((artist) => {
              const isActive = artist === activeArtist
              return (
                <button
                  key={artist}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setActiveArtist(artist)
                    setIsArtistMenuOpen(false)
                  }}
                  className={cn(
                    'capitalize text-xs md:text-sm rounded-full px-4 py-2 border transition-colors',
                    isActive
                      ? 'bg-[#fabb42] border-[#fabb42] text-black font-semibold'
                      : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white',
                  )}
                >
                  {artist}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-white/60">No pieces found for this filter yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filteredItems.map((item, itemIndex) => (
            <GalleryCard
              key={item.piece}
              item={item}
              onOpen={(imageIndex) => setLightbox({ itemIndex, imageIndex })}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <GalleryLightbox
          items={filteredItems}
          itemIndex={lightbox.itemIndex}
          imageIndex={lightbox.imageIndex}
          onClose={() => setLightbox(null)}
          onNavigate={(itemIndex) => setLightbox({ itemIndex, imageIndex: 0 })}
        />
      )}
    </div>
  )
}
