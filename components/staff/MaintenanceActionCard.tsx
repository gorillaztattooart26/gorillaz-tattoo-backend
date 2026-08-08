'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface MaintenanceActionCardProps<T> {
  title: string
  description: string
  actionLabel: string
  confirmMessage: (months: number) => string
  onRun: (months: number) => Promise<{ error?: string; data?: T }>
  formatResult: (data: T) => string
}

/**
 * One "Database Maintenance" card — a months-threshold number input plus a
 * run button, used for all four maintenance jobs (archive old completed
 * bookings, delete old archived inquiries/bookings/payments). Generic over
 * the RPC's return shape so each card can format its own result text
 * (e.g. bookings' "N deleted, M skipped (had payments)" vs. the simple
 * "N deleted" of the other three).
 */
export function MaintenanceActionCard<T>({
  title,
  description,
  actionLabel,
  confirmMessage,
  onRun,
  formatResult,
}: MaintenanceActionCardProps<T>) {
  const [months, setMonths] = useState(6)
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const onClick = async () => {
    if (!Number.isFinite(months) || months < 0) {
      setFeedback({ type: 'error', message: 'Enter a valid number of months.' })
      return
    }
    if (!confirm(confirmMessage(months))) return

    setFeedback(null)
    setIsPending(true)
    const result = await onRun(months)
    setIsPending(false)

    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
      return
    }
    setFeedback({ type: 'success', message: formatResult(result.data as T) })
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-5 md:rounded-2xl">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-xs text-[var(--foreground)]/50">{description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[var(--foreground)]/60">
          older than
          <input
            type="number"
            min={0}
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
            className="w-16 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--foreground)]"
          />
          months
        </label>
        <button
          type="button"
          disabled={isPending}
          onClick={onClick}
          className="rounded-full bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-60"
        >
          {isPending ? 'running…' : actionLabel}
        </button>
      </div>

      {feedback &&
        (feedback.type === 'success' ? (
          <p role="status" aria-live="polite" className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {feedback.message}
          </p>
        ) : (
          <p role="alert" className="mt-3 text-xs text-red-400">
            {feedback.message}
          </p>
        ))}
    </div>
  )
}
