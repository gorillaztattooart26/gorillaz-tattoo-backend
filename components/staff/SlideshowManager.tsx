'use client'

import { useEffect, useRef, useState } from 'react'
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
import { CheckCircle2, Eye, GripVertical, ImagePlus, Trash2, Upload } from 'lucide-react'
import {
  deleteSlideshowImageAction,
  replaceSlideshowImageAction,
  reorderSlideshowImagesAction,
  uploadSlideshowImageAction,
} from '@/app/staff/(protected)/gallery/homepage-actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { StaffSlideshowImage } from '@/lib/staff/homepage-media'

interface Item {
  id: string
  imageUrl: string
  alt: string
}

interface SlideshowManagerProps {
  slides: StaffSlideshowImage[]
}

/** Small inline spinner + label — same visual language as app/staff/(protected)/loading.tsx, reused here as the upload-in-progress indicator. */
function UploadingIndicator({ label }: { label: string }) {
  return (
    <span role="status" className="flex items-center gap-2 text-xs text-[var(--foreground)]/60">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      {label}
    </span>
  )
}

function SlideCard({
  item,
  index,
  onReplace,
  onDelete,
  onPreview,
  busy,
}: {
  item: Item
  index: number
  onReplace: (id: string, formData: FormData) => void
  onDelete: (id: string) => void
  onPreview: (item: Item) => void
  busy: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

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
          Slide {index + 1}
        </span>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder slide ${index + 1}`}
          className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-[var(--foreground)]/40 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onPreview(item)}
        aria-label={`Preview slide ${index + 1}`}
        className="group relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--gz-ink-900)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        <Image
          src={item.imageUrl}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
          loading="lazy"
          className="object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
          <Eye className="h-5 w-5 text-white" />
        </span>
      </button>

      <form action={(formData) => onReplace(item.id, formData)} className="flex flex-col gap-2">
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
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            replace
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            disabled={busy}
            aria-label={`Delete slide ${index + 1}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-red-500/40 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {busy && <UploadingIndicator label="saving…" />}
      </form>
    </div>
  )
}

/**
 * Owner-only manager for the homepage "Dominate" interstitial slideshow —
 * the full-bleed crossfade banner between Process and Inquire
 * (components/sections/Process.tsx). Unlike the fixed 8-slot Studio
 * Portfolio strip, this is a genuinely variable-length, orderable list:
 * add/replace/delete any slide, drag to reorder. Reordering is staged
 * locally and only written on "Save order" — every other mutation
 * (add/replace/delete) takes effect immediately, matching how the rest of
 * the Homepage CMS behaves, since those aren't really "undoable" in place
 * the way a pending drag is.
 */
export function SlideshowManager({ slides }: SlideshowManagerProps) {
  const toItems = (source: StaffSlideshowImage[]): Item[] =>
    source.map((s) => ({ id: s.id, imageUrl: s.imageUrl, alt: s.alt }))

  const [items, setItems] = useState<Item[]>(() => toItems(slides))
  const [savedOrder, setSavedOrder] = useState<string[]>(() => items.map((i) => i.id))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [previewItem, setPreviewItem] = useState<Item | null>(null)
  const addFormRef = useRef<HTMLFormElement>(null)

  // Server actions revalidate the route but don't remount this client
  // component, so without this the grid would keep showing stale slides
  // after an add/replace/delete/reorder until a manual page refresh.
  useEffect(() => {
    const next = toItems(slides)
    setItems(next)
    setSavedOrder(next.map((i) => i.id))
  }, [slides])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const currentOrder = items.map((i) => i.id)
  const isOrderDirty =
    currentOrder.length === savedOrder.length && currentOrder.some((id, i) => id !== savedOrder[i])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    setItems((prev) => arrayMove(prev, oldIndex, newIndex))
  }

  const onSaveOrder = async () => {
    setError(null)
    setSuccess(null)
    setIsSavingOrder(true)
    const result = await reorderSlideshowImagesAction(items.map((item) => item.id))
    setIsSavingOrder(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSavedOrder(items.map((item) => item.id))
    setSuccess('Slide order saved — live on the homepage now.')
  }

  const onCancelOrder = () => {
    const byId = new Map(items.map((item) => [item.id, item]))
    setItems(savedOrder.map((id) => byId.get(id)).filter((item): item is Item => Boolean(item)))
    setError(null)
    setSuccess(null)
  }

  const onAdd = async (formData: FormData) => {
    if (isAdding) return
    setError(null)
    setSuccess(null)
    setIsAdding(true)
    const result = await uploadSlideshowImageAction(formData)
    setIsAdding(false)
    if (result.error) {
      setError(result.error)
      return
    }
    addFormRef.current?.reset()
    setSuccess('Slide added — live on the homepage now.')
  }

  const onReplace = async (id: string, formData: FormData) => {
    if (busyId) return
    setError(null)
    setSuccess(null)
    setBusyId(id)
    const result = await replaceSlideshowImageAction(id, formData)
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess('Slide updated — live on the homepage now.')
  }

  const onDelete = async (id: string) => {
    if (busyId) return
    if (!confirm('Remove this slide from the homepage slideshow?')) return
    setError(null)
    setSuccess(null)
    setBusyId(id)
    const result = await deleteSlideshowImageAction(id)
    setBusyId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess('Slide removed.')
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-6 md:rounded-2xl">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Homepage Studio Portfolio Slideshow</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
        The full-bleed &quot;Dominate&quot; crossfade banner between Process and Inquire on the homepage. Add,
        replace, remove, or drag to reorder — the banner&apos;s layout, timing, and transitions stay exactly the
        same, only the photos change.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p role="status" aria-live="polite" className="mt-4 flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      )}

      {items.length === 0 && (
        <p className="mt-4 text-sm text-[var(--foreground)]/50">
          No custom slides yet — the homepage is showing its original slideshow. Upload a photo below to start
          replacing it.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => (
              <SlideCard
                key={item.id}
                item={item}
                index={index}
                onReplace={onReplace}
                onDelete={onDelete}
                onPreview={setPreviewItem}
                busy={busyId === item.id}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isOrderDirty && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-4 py-3">
          <span className="text-xs text-[var(--foreground)]/70">Slide order changed — not saved yet.</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelOrder}
              disabled={isSavingOrder}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5 disabled:opacity-60"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={onSaveOrder}
              disabled={isSavingOrder}
              className="flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-60"
            >
              {isSavingOrder ? 'saving order…' : 'save order'}
            </button>
          </div>
        </div>
      )}

      <form
        ref={addFormRef}
        action={onAdd}
        className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-xs text-[var(--foreground)]/50">
          alt text
          <input
            name="alt"
            required
            placeholder="describe the new slide"
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30"
          />
        </label>
        <div className="flex-1">
          <input
            name="image"
            type="file"
            accept="image/*"
            required
            className="block w-full text-sm text-[var(--foreground)]/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--primary-foreground)]"
          />
        </div>
        <button
          type="submit"
          disabled={isAdding}
          className="flex items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" />
          {isAdding ? 'uploading…' : 'add slide'}
        </button>
      </form>
      {isAdding && (
        <div className="mt-2">
          <UploadingIndicator label="Uploading new slide…" />
        </div>
      )}

      <Dialog open={previewItem !== null} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Slide preview</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[var(--gz-ink-900)]">
              <Image src={previewItem.imageUrl} alt={previewItem.alt} fill sizes="600px" className="object-cover" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
