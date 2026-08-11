import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import {
  isReminderEligible,
  reminderDeliveriesTable,
  type ClaimedReminderRow,
  type ReminderType,
} from '@/lib/reminders/process'
import { manilaDateTimeToUtcIso } from '@/lib/staff/timezone'
import { getBaseUrl } from '@/lib/url'
import {
  sendPaymentDueReminderEmail,
  sendAppointment24hReminderEmail,
  sendAppointment2hReminderEmail,
  type ReminderSendOutcome,
} from '@/lib/emails'

/**
 * Stage 3E — delivery only. Stage 3D's claim step (lib/reminders/process.ts)
 * is untouched: this module only ever reads/updates rows that already
 * exist in `reminder_deliveries`, never inserts one and never touches the
 * `UNIQUE (booking_id, reminder_type)` claim path.
 */

/** Defensive cap on how many reminders one cron invocation will attempt to deliver — keeps a single serverless execution bounded even if a large backlog of `pending` rows ever accumulates (e.g. after an extended outage). */
export const MAX_REMINDERS_PER_RUN = 25

/**
 * How long a `pending` row must sit untouched before a *different*
 * invocation is allowed to attempt it again. This is operational
 * protection against two overlapping cron invocations both trying to
 * deliver the same row at once — it is NOT the mechanism that prevents a
 * duplicate customer-facing email; that's the deterministic Resend
 * `idempotencyKey` below, which makes a redundant attempt safe regardless
 * of this window. Rows this same invocation just claimed (attempted_at set
 * moments ago, within this same synchronous request) are delivered
 * immediately without waiting for this window — see deliverPendingReminders'
 * `freshlyClaimed` parameter.
 */
const PENDING_RETRY_SAFETY_MS = 15 * 60 * 1000

export interface DeliveryResult {
  sent: number
  failed: number
  retryable: number
}

interface StalePendingRow {
  id: string
  booking_id: string
  reminder_type: string
  attempted_at: string | null
}

interface BookingForDelivery {
  id: string
  booking_id: string
  customer_name: string
  customer_email: string
  token: string
  artist_id: string
  appointment_date: string
  appointment_time: string
  status: string
  archived_at: string | null
  artists: { name: string } | null
}

/** Booking status a reminder type requires to still be eligible for delivery — mirrors the same statuses lib/reminders/process.ts claims against. */
const REQUIRED_STATUS: Record<ReminderType, string> = {
  payment_due: 'awaiting_down_payment',
  appointment_24h: 'appointment_confirmed',
  appointment_2h: 'appointment_confirmed',
}

const INELIGIBLE_ERROR = 'booking no longer eligible'

/** Deterministic Resend idempotency key — identical across every retry of the same booking/reminder pair. Never random, never time-based. */
function buildIdempotencyKey(humanBookingId: string, reminderType: ReminderType): string {
  return `reminder:${humanBookingId}:${reminderType}`
}

/**
 * Rows eligible for a *retry* attempt by a different invocation: still
 * `pending` and either never attempted or last attempted more than the
 * retry-safety window ago. Rows this invocation itself just claimed are
 * supplied separately (see deliverPendingReminders) and are not re-queried
 * here — they'd fail this same filter (their attempted_at is "now"), which
 * is exactly the point: it's what stops a *different* overlapping
 * invocation from also picking them up.
 */
async function fetchStalePendingRows(
  supabaseAdmin: SupabaseClient<Database>,
  now: Date,
  excludeIds: Set<string>,
  limit: number,
): Promise<StalePendingRow[]> {
  if (limit <= 0) return []

  const cutoffIso = new Date(now.getTime() - PENDING_RETRY_SAFETY_MS).toISOString()
  const { data, error } = await reminderDeliveriesTable(supabaseAdmin)
    .select('id, booking_id, reminder_type, attempted_at')
    .eq('status', 'pending')
    .or(`attempted_at.is.null,attempted_at.lte.${cutoffIso}`)
    .limit(limit + excludeIds.size)

  if (error) {
    console.error('[reminders] stale pending query failed:', error.message)
    return []
  }

  return ((data ?? []) as StalePendingRow[]).filter((row) => !excludeIds.has(row.id)).slice(0, limit)
}

async function fetchBookingForDelivery(
  supabaseAdmin: SupabaseClient<Database>,
  bookingId: string,
): Promise<BookingForDelivery | null> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, booking_id, customer_name, customer_email, token, artist_id, appointment_date, appointment_time, status, archived_at, artists!bookings_artist_id_fkey(name)',
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    console.error('[reminders] booking lookup for delivery failed:', error.message)
    return null
  }
  return (data as unknown as BookingForDelivery) ?? null
}

/**
 * Re-checks that a claimed reminder is still valid to send RIGHT NOW — a
 * booking can be cancelled, completed, archived, or otherwise change state
 * in the window between when Stage 3D claimed the reminder and when this
 * delivery step actually runs. Mirrors the exact status Stage 3D requires
 * per reminder type (REQUIRED_STATUS) plus the same isReminderEligible()
 * window check Stage 3D used to claim it in the first place — a reminder
 * that's still `pending` from days ago (e.g. a long-stuck row) must not be
 * sent for an appointment that has since passed.
 */
function isStillEligible(booking: BookingForDelivery, reminderType: ReminderType, now: Date): boolean {
  if (booking.archived_at !== null) return false
  if (booking.status !== REQUIRED_STATUS[reminderType]) return false

  const appointmentStartUtc = new Date(manilaDateTimeToUtcIso(booking.appointment_date, booking.appointment_time))
  return isReminderEligible(appointmentStartUtc, now, reminderType)
}

async function sendForReminderType(
  reminderType: ReminderType,
  booking: BookingForDelivery,
  idempotencyKey: string,
): Promise<ReminderSendOutcome> {
  const artistName = booking.artists?.name ?? 'the studio'

  if (reminderType === 'payment_due') {
    const baseUrl = await getBaseUrl()
    return sendPaymentDueReminderEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      bookingId: booking.booking_id,
      artistName,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      bookingUrl: `${baseUrl}/booking/${booking.token}`,
      idempotencyKey,
    })
  }

  if (reminderType === 'appointment_24h') {
    return sendAppointment24hReminderEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      bookingId: booking.booking_id,
      artistName,
      appointmentDate: booking.appointment_date,
      appointmentTime: booking.appointment_time,
      idempotencyKey,
    })
  }

  return sendAppointment2hReminderEmail({
    to: booking.customer_email,
    customerName: booking.customer_name,
    bookingId: booking.booking_id,
    artistName,
    appointmentDate: booking.appointment_date,
    appointmentTime: booking.appointment_time,
    idempotencyKey,
  })
}

interface DeliverableRow {
  id: string
  booking_id: string
  reminder_type: ReminderType
}

/**
 * Delivers as many eligible `pending` reminders as this invocation should
 * attempt: every row Stage 3D's claim step just inserted (`freshlyClaimed`),
 * plus enough stale retry-eligible rows to fill up to MAX_REMINDERS_PER_RUN.
 * Processes strictly sequentially — never Promise.all — since correctness
 * and simplicity matter more than throughput at this application's volume,
 * and sequential processing keeps each row's send-then-update pairing
 * simple to reason about.
 *
 * Never sends anything for a row whose booking has become ineligible since
 * being claimed (§7 re-check) — such a row is marked `failed` with a safe,
 * non-PII internal reason instead.
 */
export async function deliverPendingReminders(
  supabaseAdmin: SupabaseClient<Database>,
  freshlyClaimed: ClaimedReminderRow[],
  now: Date = new Date(),
): Promise<DeliveryResult> {
  const result: DeliveryResult = { sent: 0, failed: 0, retryable: 0 }

  const capped = freshlyClaimed.slice(0, MAX_REMINDERS_PER_RUN)
  const remainingCapacity = MAX_REMINDERS_PER_RUN - capped.length
  const staleRows = await fetchStalePendingRows(
    supabaseAdmin,
    now,
    new Set(capped.map((row) => row.id)),
    remainingCapacity,
  )

  const toDeliver: DeliverableRow[] = [
    ...capped,
    ...staleRows.map((row) => ({ id: row.id, booking_id: row.booking_id, reminder_type: row.reminder_type as ReminderType })),
  ]

  for (const row of toDeliver) {
    const booking = await fetchBookingForDelivery(supabaseAdmin, row.booking_id)

    if (!booking || !isStillEligible(booking, row.reminder_type, now)) {
      const { error: updateError } = await reminderDeliveriesTable(supabaseAdmin)
        .update({ status: 'failed', error: INELIGIBLE_ERROR, attempted_at: now.toISOString() })
        .eq('id', row.id)
        .eq('status', 'pending')

      if (updateError) {
        console.error('[reminders] failed to mark ineligible reminder failed:', updateError.message)
      }
      result.failed += 1
      continue
    }

    const idempotencyKey = buildIdempotencyKey(booking.booking_id, row.reminder_type)
    const outcome = await sendForReminderType(row.reminder_type, booking, idempotencyKey)

    if (outcome.outcome === 'sent') {
      const { error: updateError } = await reminderDeliveriesTable(supabaseAdmin)
        .update({ status: 'sent', sent_at: now.toISOString(), error: null })
        .eq('id', row.id)
        .eq('status', 'pending')

      if (updateError) {
        console.error('[reminders] failed to mark reminder sent:', updateError.message)
      }
      result.sent += 1
    } else if (outcome.outcome === 'permanent') {
      const { error: updateError } = await reminderDeliveriesTable(supabaseAdmin)
        .update({ status: 'failed', error: outcome.errorCode, attempted_at: now.toISOString() })
        .eq('id', row.id)
        .eq('status', 'pending')

      if (updateError) {
        console.error('[reminders] failed to mark reminder failed:', updateError.message)
      }
      result.failed += 1
    } else {
      // Transient: leave status untouched (still 'pending') so a later
      // invocation can retry it once the PENDING_RETRY_SAFETY_MS window has
      // passed — only attempted_at/error move, exactly per the Stage 3E
      // spec's "leave the row pending... do NOT mark permanently failed".
      const { error: updateError } = await reminderDeliveriesTable(supabaseAdmin)
        .update({ attempted_at: now.toISOString(), error: outcome.errorCode })
        .eq('id', row.id)
        .eq('status', 'pending')

      if (updateError) {
        console.error('[reminders] failed to record transient attempt:', updateError.message)
      }
      result.retryable += 1
    }
  }

  return result
}
