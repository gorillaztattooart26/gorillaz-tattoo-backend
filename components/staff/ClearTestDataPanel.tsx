'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getTestDataCountsAction, clearTestDataAction, type TestDataCounts } from '@/app/staff/(protected)/system/actions'

const CONFIRM_PHRASE = 'DELETE TEST DATA'

const ROW_LABELS: { key: keyof TestDataCounts; label: string }[] = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'booking_reference_images', label: 'Booking reference images' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'inquiry_images', label: 'Inquiry images' },
  { key: 'payments', label: 'Payments' },
]

/**
 * "Clear Test Data" — the pre-launch-only danger-zone tool. Loads current
 * record counts on mount so the Owner sees exactly what's about to be
 * wiped, requires typing the exact confirmation phrase before the button
 * even becomes clickable (belt-and-suspenders: clearTestDataAction also
 * re-checks the phrase server-side), and re-fetches counts after a
 * successful clear so the panel visibly reflects the now-empty tables.
 */
export function ClearTestDataPanel() {
  const [counts, setCounts] = useState<TestDataCounts | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadCounts = async () => {
    setLoadError(null)
    const result = await getTestDataCountsAction()
    if (result.error) {
      setLoadError(result.error)
      return
    }
    setCounts(result.data ?? null)
  }

  useEffect(() => {
    void loadCounts()
  }, [])

  const canConfirm = confirmText === CONFIRM_PHRASE

  const onClear = async () => {
    if (!canConfirm) return
    if (!confirm('This permanently deletes every booking, inquiry, and payment (and their images). This cannot be undone. Continue?')) {
      return
    }

    setFeedback(null)
    setIsPending(true)
    const result = await clearTestDataAction(confirmText)
    setIsPending(false)

    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
      return
    }

    const deleted = result.data
    setFeedback({
      type: 'success',
      message: deleted
        ? `Cleared: ${deleted.bookings} bookings, ${deleted.booking_reference_images} booking images, ${deleted.inquiries} inquiries, ${deleted.inquiry_images} inquiry images, ${deleted.payments} payments.`
        : 'Test data cleared.',
    })
    setConfirmText('')
    void loadCounts()
  }

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-5 md:rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Clear Test Data</h3>
          <p className="mt-1 max-w-xl text-xs text-[var(--foreground)]/60">
            Pre-launch only. Permanently removes every booking, booking reference image, inquiry, inquiry image, and
            payment — in one transaction, in FK-safe order. Never touches artists, gallery, homepage media,
            authentication, storage buckets, policies, functions, or migrations.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-red-500/20 bg-[var(--card)]/60">
        {loadError ? (
          <p role="alert" className="px-4 py-3 text-xs text-red-400">
            {loadError}
          </p>
        ) : !counts ? (
          <p className="px-4 py-3 text-xs text-[var(--foreground)]/40">Loading current record counts…</p>
        ) : (
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-[var(--foreground)]/5">
              {ROW_LABELS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="px-4 py-2 text-[var(--foreground)]/70">{label}</td>
                  <td className="px-4 py-2 text-right font-medium text-[var(--foreground)]">{counts[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="text-xs text-[var(--foreground)]/60">
          Type <span className="font-mono font-semibold text-red-400">{CONFIRM_PHRASE}</span> to enable the button
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-56 rounded-lg border border-red-500/30 bg-transparent px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/20"
          />
          <button
            type="button"
            disabled={!canConfirm || isPending}
            onClick={onClear}
            className="rounded-full bg-red-500 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? 'clearing…' : 'permanently clear test data'}
          </button>
        </div>
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
