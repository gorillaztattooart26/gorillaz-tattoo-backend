'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { ChevronDown, SlidersHorizontal, Trash2, Upload } from 'lucide-react'
import { createGalleryItemAction, deleteGalleryItemAction } from '@/app/staff/(protected)/gallery/actions'
import { fieldClasses as sharedFieldClasses } from '@/components/ui/fieldStyles'
import { ChevronIcon } from '@/components/common/icons'
import { cn } from '@/lib/utils'
import type { StaffGalleryItem } from '@/lib/staff/gallery'

// Noticeably roomier than the shared site-wide field style — this form's
// category dropdown read as cramped at the default py-3.
const fieldClasses = cn(sharedFieldClasses, 'py-4')

const CATEGORIES = [
  'hyper-realism',
  'realism',
  'blackwork',
  'japanese',
  'polynesian',
  'anime',
  'line art',
  'minimalist',
  'neo traditional',
  'portrait',
]

interface GalleryManagerProps {
  items: StaffGalleryItem[]
}

export function GalleryManager({ items }: GalleryManagerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  )
  const [activeCategory, setActiveCategory] = useState('all')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const filteredItems =
    activeCategory === 'all' ? items : items.filter((item) => item.category === activeCategory)

  const onSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await createGalleryItemAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
    })
  }

  const onDelete = (id: string) => {
    if (!confirm('Remove this piece from the gallery? This cannot be undone.')) return
    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteGalleryItemAction(id)
      if (result.error) {
        setError(result.error)
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        ref={formRef}
        action={onSubmit}
        className="grid grid-cols-1 gap-6 rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-6 md:rounded-2xl lg:grid-cols-2"
      >
        <h2 className="text-base font-semibold text-[var(--foreground)] lg:col-span-2">Add a piece</h2>

        <label className="block">
          <span className="mb-2 block text-xs text-[var(--foreground)]/50">Piece name</span>
          <input name="piece" required placeholder="e.g. blackwork piece 32" className={fieldClasses} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-[var(--foreground)]/50">Category</span>
          <div className="relative">
            <select
              name="category"
              required
              defaultValue=""
              className={cn(fieldClasses, 'appearance-none pr-11')}
            >
              <option value="" disabled>
                select a category
              </option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40" />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-[var(--foreground)]/50">Photos</span>
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            required
            className="block w-full text-sm text-[var(--foreground)]/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--primary-foreground)]"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-2 block text-xs text-[var(--foreground)]/50">Alt text (for SEO / accessibility)</span>
          <textarea
            name="alt"
            required
            rows={2}
            placeholder="describe the piece — style, placement, artist"
            className={fieldClasses}
          />
        </label>

        {error && <p className="text-sm text-red-400 lg:col-span-2">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 disabled:opacity-60 lg:col-span-2 lg:w-fit"
        >
          <Upload className="h-4 w-4" />
          {isPending ? 'uploading…' : 'add piece'}
        </button>
      </form>

      {items.length > 0 && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen((open) => !open)}
            aria-expanded={isMobileFilterOpen}
            className="flex w-fit items-center gap-2 rounded-full border border-[var(--foreground)]/25 px-4 py-2 text-xs text-[var(--foreground)]/70 transition-colors hover:border-[var(--foreground)]/50 hover:text-[var(--foreground)] md:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            filter by
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isMobileFilterOpen && 'rotate-180')} />
          </button>

          <div
            className={cn(
              'flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)]/40 p-4',
              'md:rounded-none md:border-0 md:bg-transparent md:p-0',
              !isMobileFilterOpen && 'hidden md:flex',
            )}
            role="group"
            aria-label="Filter your pieces"
          >
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
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
                      : 'border-[var(--foreground)]/25 text-[var(--foreground)]/70 hover:border-[var(--foreground)]/50 hover:text-[var(--foreground)]',
                  )}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {items.length > 0 && filteredItems.length === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">No pieces found for this filter yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl"
            >
              <div className="relative aspect-square">
                <Image
                  src={item.images[0]}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  disabled={isPending && deletingId === item.id}
                  aria-label={`Delete ${item.piece}`}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)]/70 text-[var(--foreground)] opacity-0 transition-opacity hover:bg-red-500/80 group-hover:opacity-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium capitalize text-[var(--foreground)]">{item.piece}</p>
                <p className="mt-0.5 truncate text-xs capitalize text-[var(--foreground)]/50">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
