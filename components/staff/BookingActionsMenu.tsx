'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarClock, CheckCircle2, X, XCircle } from 'lucide-react'
import {
  cancelBookingAction,
  completeBookingAction,
  rescheduleBookingAction,
} from '@/app/staff/(protected)/bookings/actions'
import type { StaffBooking } from '@/lib/staff/bookings'

interface BookingActionsMenuProps {
  booking: StaffBooking
}

/**
 * Cancel / reschedule / mark-complete controls for one Bookings row.
 * Terminal statuses (already cancelled/completed) just show the status —
 * nothing left to do. Reschedule opens a small inline date/time picker
 * rather than a full modal since it's only two fields.
 *
 * Every action here is destructive or hard to casually undo, so all
 * three confirm before doing anything — cancel and complete via the
 * browser's native confirm(), reschedule via the same pattern once a new
 * date/time is picked. Feedback after the fact uses the same inline
 * red/emerald text convention as every other staff manager (Hero Video,
 * Portfolio Images, Artist Profile, etc.) instead of a native alert(),
 * which was the one place in the dashboard that broke that consistency.
 */
export function BookingActionsMenu({ booking }: BookingActionsMenuProps) {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [date, setDate] = useState(booking.appointmentDate)
  const [time, setTime] = useState(booking.appointmentTime)
  const [modalError, setModalError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, setIsPending] = useState(false)
  const rescheduleTriggerRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isRescheduling) return

    const triggerNode = rescheduleTriggerRef.current
    const modalNode = modalRef.current
    const focusable = modalNode?.querySelectorAll<HTMLElement>(
      'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRescheduling(false)
        return
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerNode?.focus()
    }
  }, [isRescheduling])

  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return <span className="text-xs text-[var(--foreground)]/30">no actions</span>
  }

  const onCancel = async () => {
    if (
      !confirm(
        `Cancel ${booking.bookingId} for ${booking.customerName}? Per studio policy, this forfeits their non-refundable reservation payment. This can't be undone.`,
      )
    ) {
      return
    }
    setFeedback(null)
    setIsPending(true)
    const result = await cancelBookingAction(booking.id)
    setIsPending(false)
    setFeedback(
      result.error ? { type: 'error', message: result.error } : { type: 'success', message: 'Booking cancelled.' },
    )
  }

  const onComplete = async () => {
    if (!confirm(`Mark ${booking.bookingId} for ${booking.customerName} as completed?`)) return
    setFeedback(null)
    setIsPending(true)
    const result = await completeBookingAction(booking.id)
    setIsPending(false)
    setFeedback(
      result.error
        ? { type: 'error', message: result.error }
        : { type: 'success', message: 'Booking marked completed.' },
    )
  }

  const onOpenReschedule = () => {
    setModalError(null)
    setFeedback(null)
    setIsRescheduling(true)
  }

  const onReschedule = async () => {
    if (
      !confirm(
        `Move ${booking.bookingId} from ${booking.appointmentDate} ${booking.appointmentTime} to ${date} ${time}?`,
      )
    ) {
      return
    }
    setModalError(null)
    setIsPending(true)
    const result = await rescheduleBookingAction(booking.id, date, time)
    setIsPending(false)
    if (result.error) {
      setModalError(result.error)
      return
    }
    setIsRescheduling(false)
    setFeedback({ type: 'success', message: 'Booking rescheduled.' })
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1.5">
      <div className="flex flex-col gap-1">
        <button
          ref={rescheduleTriggerRef}
          type="button"
          onClick={onOpenReschedule}
          disabled={isPending}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5 disabled:opacity-60"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          reschedule
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={isPending}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-60"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          complete
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
        >
          <XCircle className="h-3.5 w-3.5" />
          cancel
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

      {isRescheduling && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Reschedule ${booking.bookingId}`}
          onClick={() => setIsRescheduling(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--background)]/80 p-4"
        >
          <div
            ref={modalRef}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Reschedule {booking.bookingId}
              </h2>
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--foreground)]/60 transition-colors hover:bg-[var(--foreground)]/10 hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs text-[var(--foreground)]/50">
                New date
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-[var(--foreground)]/50">
                New time
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </label>

              {modalError && (
                <p role="alert" className="text-xs text-red-400">
                  {modalError}
                </p>
              )}

              <button
                type="button"
                onClick={onReschedule}
                disabled={isPending}
                className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 disabled:opacity-60"
              >
                {isPending ? 'saving…' : 'save new time'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
