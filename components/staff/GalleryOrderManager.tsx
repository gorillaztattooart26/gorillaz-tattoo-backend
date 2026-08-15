'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, ChevronDown, GripVertical } from 'lucide-react'
import { reorderGalleryItemsAction } from '@/app/staff/(protected)/gallery/actions'
import { cn } from '@/lib/utils'
import type { StaffGalleryItem } from '@/lib/staff/gallery'

interface GalleryOrderManagerProps {
  items: StaffGalleryItem[]
}

/** Zero-padded position label — "01", "02", ... — purely a display transform of `index + 1`, never persisted. */
function positionLabel(position: number): string {
  return String(position + 1).padStart(2, '0')
}

function OrderCard({
  item,
  position,
  dragHandleProps,
  isDragging,
}: {
  item: StaffGalleryItem
  position: number
  dragHandleProps?: { attributes: ReturnType<typeof useSortable>['attributes']; listeners: ReturnType<typeof useSortable>['listeners'] }
  isDragging?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-3 md:rounded-2xl',
        isDragging && 'opacity-70 shadow-xl',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums text-[var(--foreground)]/40">{positionLabel(position)}</span>
        {dragHandleProps && (
          <button
            type="button"
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            aria-label={`Drag to reorder ${item.piece} — currently position ${position + 1}`}
            style={{ touchAction: 'none' }}
            className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md text-[var(--foreground)]/40 transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[var(--gz-ink-900)]">
        <Image src={item.images[0]} alt={item.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw" className="object-cover" />
        {item.images.length > 1 && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
            {item.images.length}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="break-words text-sm font-medium capitalize leading-snug text-[var(--foreground)]">{item.piece}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-snug text-[var(--foreground)]/50">
          <span className="break-words capitalize text-[var(--primary)]">{item.artist_name}</span>
          <span aria-hidden className="text-[var(--foreground)]/20">·</span>
          <span className="break-words capitalize">{item.category}</span>
        </p>
      </div>
    </div>
  )
}

function SortableOrderCard({ item, position }: { item: StaffGalleryItem; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'relative z-10')}>
      <OrderCard item={item} position={position} dragHandleProps={{ attributes, listeners }} isDragging={isDragging} />
    </div>
  )
}

/**
 * Owner-only global portfolio ordering (Task 7) — every artist's pieces
 * in one draggable list, controlling the single `gallery_items.display_order`
 * sequence the public /portfolio page (and its lightbox) already sorts by.
 * Pure reorder: deliberately has no delete/edit affordance of its own, so
 * a drag gesture can never be mistaken for or trigger a destructive action
 * — Add/Delete stays exclusively in GalleryManager below this, unchanged.
 *
 * Drag handle only (not the whole row) initiates a drag, with
 * `touchAction: 'none'` scoped to just that handle — the standard dnd-kit
 * pattern for a long touch-scrollable sortable list: touching anywhere
 * else on a row still scrolls the page normally, only the handle itself
 * intercepts the gesture as a drag.
 */
export function GalleryOrderManager({ items: initialItems }: GalleryOrderManagerProps) {
  const [items, setItems] = useState(initialItems)
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState(initialItems)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  // Expanded by default so the Owner sees the ordering tool immediately on
  // opening the Gallery dashboard — collapsing is purely a local UI
  // preference, never persisted, and never touches `items`/order state.
  const [isExpanded, setIsExpanded] = useState(true)

  // Server Actions revalidate the route but don't remount this client
  // component — without this, adding/deleting a piece elsewhere on the
  // page wouldn't be reflected here until a manual refresh.
  useEffect(() => {
    setItems(initialItems)
    setLastConfirmedOrder(initialItems)
  }, [initialItems])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await reorderGalleryItemsAction(reordered.map((item) => item.id))
      if (result.error) {
        // Don't leave the UI showing an order that didn't actually save —
        // revert to the last order we know the server confirmed.
        setItems(lastConfirmedOrder)
        setError(result.error)
        return
      }
      setLastConfirmedOrder(reordered)
      setSuccess('Order updated — live on the public Portfolio now.')
    })
  }

  if (items.length === 0) {
    return null
  }

  const pieceCountLabel = `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} · Drag to reorder`

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 md:rounded-2xl">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls="gallery-order-panel"
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Portfolio Order</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{pieceCountLabel}</p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-5 w-5 shrink-0 text-[var(--foreground)]/50 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      <div
        id="gallery-order-panel"
        className={cn('grid transition-all duration-200 ease-out', isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6">
            {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
            {success && (
              <p role="status" aria-live="polite" className="mb-4 flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </p>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div
                  className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6"
                  aria-disabled={isPending}
                >
                  {items.map((item, index) => (
                    <SortableOrderCard key={item.id} item={item} position={index} />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId
                  ? (() => {
                      const activeIndex = items.findIndex((item) => item.id === activeId)
                      const activeItem = items[activeIndex]
                      if (!activeItem) return null
                      return <OrderCard item={activeItem} position={activeIndex} />
                    })()
                  : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  )
}
