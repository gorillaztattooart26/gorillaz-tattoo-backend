'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, GripVertical, ImagePlus, Trash2, Upload } from 'lucide-react'
import {
  assignExistingPortfolioSlotImageAction,
  deletePortfolioSlotImageAction,
  reorderPortfolioSlotsAction,
  uploadPortfolioSlotImageAction,
} from '@/app/staff/(protected)/gallery/homepage-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ExistingSiteImage, StaffPortfolioSlot } from '@/lib/staff/homepage-media'

const ROLE_LABELS = [
  'Row 1 — Tile 1',
  'Row 1 — Tile 2',
  'Row 1 — Tile 3',
  'Row 2 — Tile 1',
  'Row 2 — Tile 2',
  'Row 2 — Tile 3',
  'Anchor tile',
  'Full-bleed reveal',
]

interface Item {
  id: string
  imageUrl: string
  alt: string
  isCustom: boolean
}

interface PortfolioImagesManagerProps {
  slots: StaffPortfolioSlot[]
  existingImages: ExistingSiteImage[]
}

function SlotCard({
  item,
  slotIndex,
  onUpload,
  onDelete,
  onChoosePhoto,
  isPending,
}: {
  item: Item
  slotIndex: number
  onUpload: (slotIndex: number, formData: FormData) => void
  onDelete: (slotIndex: number) => void
  onChoosePhoto: (slotIndex: number) => void
  isPending: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const formRef = useRef<HTMLFormElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-3 md:rounded-2xl',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--foreground)]/50">
          {ROLE_LABELS[slotIndex]}
        </span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${ROLE_LABELS[slotIndex]}`}
          className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--gz-ink-900)]">
        <Image src={item.imageUrl} alt={item.alt} fill sizes="200px" className="object-cover" />
        {!item.isCustom && (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--background)]/70 px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]/70">
            default
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChoosePhoto(slotIndex)}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/80 transition-colors hover:border-[var(--foreground)]/40 hover:text-[var(--foreground)] disabled:opacity-60"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        choose existing photo
      </button>

      <form
        ref={formRef}
        action={(formData) => onUpload(slotIndex, formData)}
        className="flex flex-col gap-2"
      >
        <input type="hidden" name="slot" value={slotIndex} />
        <input
          name="alt"
          defaultValue={item.alt}
          required
          placeholder="alt text"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--foreground)]/40"
        />
        <input
          name="image"
          type="file"
          accept="image/*"
          required
          className="block w-full text-xs text-[var(--foreground)]/70 file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-[var(--primary-foreground)]"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            {item.isCustom ? 'replace' : 'upload'}
          </button>
          {item.isCustom && (
            <button
              type="button"
              onClick={() => onDelete(slotIndex)}
              disabled={isPending}
              aria-label={`Remove ${ROLE_LABELS[slotIndex]} photo`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-500/40 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export function PortfolioImagesManager({ slots, existingImages }: PortfolioImagesManagerProps) {
  const [items, setItems] = useState<Item[]>(
    slots.map((slot) => ({
      id: `slot-origin-${slot.slot}`,
      imageUrl: slot.imageUrl,
      alt: slot.alt,
      isCustom: slot.isCustom,
    })),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  // Server actions revalidate the route but don't remount this client
  // component, so without this the cards would keep showing stale photos
  // after an upload/delete/reorder until a manual page refresh.
  useEffect(() => {
    setItems(
      slots.map((slot) => ({
        id: `slot-origin-${slot.slot}`,
        imageUrl: slot.imageUrl,
        alt: slot.alt,
        isCustom: slot.isCustom,
      })),
    )
  }, [slots])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filteredExistingImages = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return existingImages
    return existingImages.filter((image) => image.label.toLowerCase().includes(query))
  }, [existingImages, search])

  const persistOrder = (nextItems: Item[]) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await reorderPortfolioSlotsAction(
        nextItems.map((item, index) => ({ slot: index, imageUrl: item.imageUrl, alt: item.alt })),
      )
      if (result.error) {
        setError(result.error)
        return
      }
      setItems(nextItems.map((item) => ({ ...item, isCustom: true })))
      setSuccess('Order updated — live on the homepage now.')
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    persistOrder(reordered)
  }

  const onUpload = (slotIndex: number, formData: FormData) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await uploadPortfolioSlotImageAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(`${ROLE_LABELS[slotIndex]} photo updated — live on the homepage now.`)
    })
  }

  const onDelete = (slotIndex: number) => {
    if (!confirm(`Remove this photo from "${ROLE_LABELS[slotIndex]}"? It will fall back to the default photo.`)) {
      return
    }
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await deletePortfolioSlotImageAction(slotIndex)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`${ROLE_LABELS[slotIndex]} reverted to its default photo.`)
      }
    })
  }

  const onChoosePhoto = (slotIndex: number) => {
    setSearch('')
    setPickerSlot(slotIndex)
  }

  const onSelectExistingImage = (image: ExistingSiteImage) => {
    if (pickerSlot === null) return
    const slotIndex = pickerSlot
    setError(null)
    setSuccess(null)
    setPickerSlot(null)
    startTransition(async () => {
      const result = await assignExistingPortfolioSlotImageAction(slotIndex, image.url, image.alt)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(`${ROLE_LABELS[slotIndex]} photo updated — live on the homepage now.`)
    })
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-6 md:rounded-2xl">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Homepage Studio Portfolio</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        The 8 photos in the homepage&apos;s scrolling &quot;Studio portfolio&quot; strip. Drag a card to change
        which photo plays which role, upload a new photo, or choose one already on the site — the strip&apos;s
        layout stays the same, only the photos move.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {success && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => (
              <SlotCard
                key={item.id}
                item={item}
                slotIndex={index}
                onUpload={onUpload}
                onDelete={onDelete}
                onChoosePhoto={onChoosePhoto}
                isPending={isPending}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={pickerSlot !== null} onOpenChange={(open) => !open && setPickerSlot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Choose a photo{pickerSlot !== null ? ` — ${ROLE_LABELS[pickerSlot]}` : ''}
            </DialogTitle>
            <DialogDescription>Pick from photos already live in the gallery. No new upload needed.</DialogDescription>
          </DialogHeader>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="search by piece or artist…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40"
          />

          {filteredExistingImages.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">No matching photos.</p>
          ) : (
            <div className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {filteredExistingImages.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => onSelectExistingImage(image)}
                  disabled={isPending}
                  className="group flex flex-col gap-1 text-left disabled:opacity-60"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--gz-ink-900)] ring-1 ring-[var(--border)] transition-all group-hover:ring-2 group-hover:ring-[var(--primary)]">
                    <Image src={image.url} alt={image.alt} fill sizes="150px" className="object-cover" />
                  </div>
                  <span className="truncate text-[11px] text-[var(--muted-foreground)]">{image.label}</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
