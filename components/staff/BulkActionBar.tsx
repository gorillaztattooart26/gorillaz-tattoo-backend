'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore, Trash2, CheckCircle2 } from 'lucide-react'

interface BulkActionBarProps {
  count: number
  view: 'active' | 'archived'
  itemNoun: string // e.g. "booking" / "inquiry" / "payment"
  onArchive?: () => Promise<{ error?: string; succeeded: number; skipped?: { id: string; reason: string }[] }>
  onRestore?: () => Promise<{ error?: string; succeeded: number; skipped?: { id: string; reason: string }[] }>
  onDelete: () => Promise<{ error?: string; succeeded: number; skipped?: { id: string; reason: string }[] }>
  onDone: () => void
}

/**
 * Sticky-ish toolbar shown above a table whenever one or more rows are
 * checked — Archive Selected (active view) / Restore Selected (archived
 * view), always Delete Selected. Danger-zone styling on Delete per the
 * feature spec's UI requirements; every action confirms first since bulk
 * operations are the easiest to fat-finger.
 */
export function BulkActionBar({ count, view, itemNoun, onArchive, onRestore, onDelete, onDone }: BulkActionBarProps) {
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (count === 0) return null

  const plural = count === 1 ? itemNoun : `${itemNoun}s`

  const runAction = async (
    label: string,
    action: () => Promise<{ error?: string; succeeded: number; skipped?: { id: string; reason: string }[] }>,
  ) => {
    setFeedback(null)
    setIsPending(true)
    const result = await action()
    setIsPending(false)
    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
      return
    }
    const skippedNote = result.skipped?.length ? ` (${result.skipped.length} skipped)` : ''
    setFeedback({ type: 'success', message: `${label}: ${result.succeeded} ${plural}${skippedNote}.` })
    onDone()
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 md:rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {count} {plural} selected
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {view === 'active' && onArchive && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Archive ${count} selected ${plural}? This can be undone from the Archived tab.`)) return
                void runAction('Archived', onArchive)
              }}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5 disabled:opacity-60"
            >
              <Archive className="h-3.5 w-3.5" />
              archive selected
            </button>
          )}
          {view === 'archived' && onRestore && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Restore ${count} selected ${plural}?`)) return
                void runAction('Restored', onRestore)
              }}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-60"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              restore selected
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Permanently delete ${count} selected ${plural}? This can't be undone.`)) return
              void runAction('Deleted', onDelete)
            }}
            className="flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            delete selected
          </button>
        </div>
      </div>

      {feedback &&
        (feedback.type === 'success' ? (
          <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {feedback.message}
          </p>
        ) : (
          <p role="alert" className="text-xs text-red-400">
            {feedback.message}
          </p>
        ))}
    </div>
  )
}
