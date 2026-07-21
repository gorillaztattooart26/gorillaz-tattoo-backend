'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Trash2, Upload } from 'lucide-react'
import { createGalleryItemAction, deleteGalleryItemAction } from '@/app/staff/(protected)/gallery/actions'
import { fieldClasses as sharedFieldClasses } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'
import type { StaffGalleryItem } from '@/lib/staff/gallery'
import type { Artist } from '@/types/artist'

// Noticeably roomier than the shared site-wide field style — this form's
// dropdowns (category, artist) read as cramped at the default py-3.
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
  artists: Artist[]
}

export function GalleryManager({ items, artists }: GalleryManagerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
        className="grid grid-cols-1 gap-6 rounded-lg border border-white/10 bg-neutral-900/60 p-6 md:rounded-2xl lg:grid-cols-2"
      >
        <h2 className="text-base font-semibold text-white lg:col-span-2">Add a piece</h2>

        <label className="block">
          <span className="mb-2 block text-xs text-white/50">Piece name</span>
          <input name="piece" required placeholder="e.g. blackwork piece 32" className={fieldClasses} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/50">Category</span>
          <select name="category" required defaultValue="" className={fieldClasses}>
            <option value="" disabled>
              select a category
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/50">Artist</span>
          <select name="artistName" required defaultValue="" className={fieldClasses}>
            <option value="" disabled>
              select an artist
            </option>
            {artists.map((artist) => (
              <option key={artist.slug} value={artist.name}>
                {artist.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/50">Photos</span>
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            required
            className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[#fabb42] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-2 block text-xs text-white/50">Alt text (for SEO / accessibility)</span>
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
          className="flex items-center justify-center gap-2 rounded-full bg-[#fabb42] px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] disabled:opacity-60 lg:col-span-2 lg:w-fit"
        >
          <Upload className="h-4 w-4" />
          {isPending ? 'uploading…' : 'add piece'}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg border border-white/10 bg-neutral-900/60 md:rounded-2xl"
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
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-500/80 group-hover:opacity-100 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-medium capitalize text-white">{item.piece}</p>
              <p className="mt-0.5 truncate text-xs capitalize text-white/50">
                {item.category} · {item.artist_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
