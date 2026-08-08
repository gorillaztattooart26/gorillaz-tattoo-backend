'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore, Trash2, CheckCircle2 } from 'lucide-react'

interface RecordArchiveControlsProps {
  view: 'active' | 'archived'
  itemLabel: string // shown in confirm dialogs, e.g. a booking/inquiry/payment's human-readable id
  onArchive?: () => Promise<{ error?: string }>
  onRestore?: () => Promise<{ error?: string }>
  onDelete: () => Promise<{ error?: string }>
}

/**
 * Owner-only Archive / Restore / Delete row controls — same inline-pill +
 * confirm() + inline feedback-text convention as BookingActionsMenu.
 * Active view shows Archive; Archived view shows Restore + Delete
 * Permanently. Never rendered for non-owners (callers gate on
 * `artist.is_owner` before mounting this).
 */
export function RecordArchiveControls({ view, itemLabel, onArchive, onRestore, onDelete }: RecordArchiveControlsProps) {
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const run = async (action: () => Promise<{ error?: string }>, successMessage: string) => {
    setFeedback(null)
    setIsPending(true)
    const result = await action()
    setIsPending(false)
    setFeedback(
      result.error ? { type: 'error', message: result.error } : { type: 'success', message: successMessage },
    )
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {view === 'active' && onArchive && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`Archive ${itemLabel}? It'll be hidden from the default view but can be restored.`)) return
              void run(onArchive, 'Archived.')
            }}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5 disabled:opacity-60"
          >
            <Archive className="h-3.5 w-3.5" />
            archive
          </button>
        )}
        {view === 'archived' && onRestore && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => void run(onRestore, 'Restored.')}
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-60"
          >
            <ArchiveRestore className="h-3.5 w-3.5" />
            restore
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm(`Permanently delete ${itemLabel}? This can't be undone.`)) return
            void run(onDelete, 'Deleted.')
          }}
          className="flex items-center gap-1.5 rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
          delete
        </button>
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
