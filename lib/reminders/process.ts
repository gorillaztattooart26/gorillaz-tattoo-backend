import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { manilaDateTimeToUtcIso } from '@/lib/staff/timezone'

/**
 * Stage 3D — reminder eligibility + atomic claim only. No email is ever
 * sent from this module; a successful claim leaves the row at
 * `status: 'pending'` for Stage 3E's delivery processor to pick up later.
 * See supabase/migrations/20260811020000_add_reminder_deliveries.sql for
 * the table this writes to and why `UNIQUE (booking_id, reminder_type)` is
 * the actual concurrency guarantee, not anything in this file.
 */

export type ReminderType = 'payment_due' | 'appointment_24h' | 'appointment_2h'

/** Canonical booking status values — mirrors bookings_status_check in supabase/migrations/20260805013917_remote_schema.sql. Not re-declared anywhere else in the codebase as an enum/constant, so this is the single place Stage 3 code names them. */
const BOOKING_STATUS = {
  AWAITING_DOWN_PAYMENT: 'awaiting_down_payment',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
} as const

/**
 * Hours before the appointment instant at which each reminder type becomes
 * eligible — the approved Stage 3B/3C business rules. `payment_due` is
 * anchored to the appointment instant (NOT bookings.created_at or
 * payments.created_at, per the locked business rule), same as both
 * appointment reminder stages.
 */
const REMINDER_WINDOW_HOURS: Record<ReminderType, number> = {
  payment_due: 48,
  appointment_24h: 24,
  appointment_2h: 2,
}

const HOUR_MS = 60 * 60 * 1000

/**
 * A reminder type's eligibility window is threshold-based, not exact-time
 * — the scheduler doesn't need to run at the exact second of T-minus-N
 * hours, it just needs to ask "has that threshold been reached yet, and is
 * the appointment still ahead of us". Eligible exactly when:
 *
 *   now < appointmentStart <= now + windowHours
 *
 * The strict `appointmentStart > now` half is what stops a delayed
 * scheduler run from claiming a reminder for an appointment that has
 * already started/passed — required explicitly by the Stage 3D spec.
 * The `<=` half means a reminder becomes (and stays) eligible once its
 * threshold is crossed, until the appointment arrives; combined with the
 * `reminder_deliveries` unique constraint, only the first cron run to see
 * it eligible ever claims it.
 */
export function isReminderEligible(
  appointmentStartUtc: Date,
  now: Date,
  reminderType: ReminderType,
): boolean {
  const windowMs = REMINDER_WINDOW_HOURS[reminderType] * HOUR_MS
  const appointmentMs = appointmentStartUtc.getTime()
  const nowMs = now.getTime()
  return appointmentMs > nowMs && appointmentMs <= nowMs + windowMs
}

interface CandidateBookingRow {
  id: string
  status: string
  appointment_date: string
  appointment_time: string
}

interface ExistingReminderRow {
  booking_id: string
  reminder_type: string
}

/** One row this invocation's claim step actually inserted — handed to Stage 3E's delivery step so it can attempt those rows immediately without re-querying for "freshly claimed" rows (see lib/reminders/deliver.ts). */
export interface ClaimedReminderRow {
  id: string
  booking_id: string
  reminder_type: ReminderType
}

export interface ProcessRemindersResult {
  claimed: number
  claimedRows: ClaimedReminderRow[]
}

/**
 * `types/supabase.ts` is hand-maintained (see its own header comment) and
 * deliberately not touched by Stage 3D — it doesn't declare
 * `reminder_deliveries`, so this table can't be reached through the
 * strict `Database` generic every `bookings` query in this file still
 * uses. `SupabaseClient<any>` scopes the loss of compile-time table/column
 * checking to exactly these two query sites; every result is immediately
 * cast back to the explicit local row interfaces above (`ExistingReminderRow`,
 * the inline claim shape below) so the rest of this file stays fully typed.
 * Exported so lib/reminders/deliver.ts (Stage 3E) reuses this exact cast
 * rather than redefining its own.
 */
export function reminderDeliveriesTable(supabaseAdmin: SupabaseClient<Database>) {
  return (supabaseAdmin as unknown as SupabaseClient).from('reminder_deliveries')
}

/**
 * Widens the DB-side prefilter beyond the largest reminder window (48h)
 * so a candidate is never wrongly excluded by the date-range query — the
 * exact eligibility decision always happens afterward in JS against the
 * real UTC instant via isReminderEligible(). One day of slack on each side
 * comfortably absorbs the UTC/Manila (+8h) offset between `now` and the
 * Manila calendar date `appointment_date` represents.
 */
const CANDIDATE_LOOKAHEAD_DAYS = 4
const CANDIDATE_LOOKBEHIND_DAYS = 1

function toDateOnlyIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Runs one pass of reminder eligibility + atomic claim. Intended to be
 * invoked by the cron route (app/api/cron/reminders/route.ts) — this
 * function itself has no HTTP/auth concerns and does not send email.
 *
 * Safe to call repeatedly, concurrently, or after a delay: the only
 * write is the batched claim insert at the end, which uses
 * `ignoreDuplicates` (PostgREST's `Prefer: resolution=ignore-duplicates`,
 * i.e. `INSERT ... ON CONFLICT (booking_id, reminder_type) DO NOTHING`)
 * against the unique constraint from Stage 3C — never a
 * SELECT-then-INSERT, which would race under concurrent invocations.
 *
 * @param supabaseAdmin Service-role client (see lib/supabase-admin.ts).
 *   Required because this reads across every artist's bookings and writes
 *   to reminder_deliveries, which has no authenticated write policy.
 * @param now Injectable for deterministic testing; defaults to real time.
 */
export async function processRemindersOnce(
  supabaseAdmin: SupabaseClient<Database>,
  now: Date = new Date(),
): Promise<ProcessRemindersResult> {
  const lowerBound = toDateOnlyIso(new Date(now.getTime() - CANDIDATE_LOOKBEHIND_DAYS * 24 * HOUR_MS))
  const upperBound = toDateOnlyIso(new Date(now.getTime() + CANDIDATE_LOOKAHEAD_DAYS * 24 * HOUR_MS))

  const { data: candidates, error: candidatesError } = await supabaseAdmin
    .from('bookings')
    .select('id, status, appointment_date, appointment_time')
    .in('status', [BOOKING_STATUS.AWAITING_DOWN_PAYMENT, BOOKING_STATUS.APPOINTMENT_CONFIRMED])
    .is('archived_at', null)
    .gte('appointment_date', lowerBound)
    .lte('appointment_date', upperBound)

  if (candidatesError) {
    console.error('[reminders] candidate bookings query failed:', candidatesError.message)
    throw new Error('Failed to load candidate bookings.')
  }

  const rows = (candidates ?? []) as CandidateBookingRow[]
  if (rows.length === 0) {
    return { claimed: 0, claimedRows: [] }
  }

  const bookingIds = rows.map((row) => row.id)
  const { data: existing, error: existingError } = await reminderDeliveriesTable(supabaseAdmin)
    .select('booking_id, reminder_type')
    .in('booking_id', bookingIds)

  if (existingError) {
    console.error('[reminders] existing reminder_deliveries query failed:', existingError.message)
    throw new Error('Failed to load existing reminder deliveries.')
  }

  const alreadyClaimed = new Set(
    ((existing ?? []) as ExistingReminderRow[]).map((row) => `${row.booking_id}:${row.reminder_type}`),
  )

  const attemptedAt = now.toISOString()
  const toClaim: { booking_id: string; reminder_type: ReminderType; status: 'pending'; attempted_at: string }[] = []

  for (const booking of rows) {
    const appointmentStartUtc = new Date(
      manilaDateTimeToUtcIso(booking.appointment_date, booking.appointment_time),
    )

    const candidateTypes: ReminderType[] =
      booking.status === BOOKING_STATUS.AWAITING_DOWN_PAYMENT
        ? ['payment_due']
        : booking.status === BOOKING_STATUS.APPOINTMENT_CONFIRMED
          ? ['appointment_24h', 'appointment_2h']
          : []

    for (const reminderType of candidateTypes) {
      if (alreadyClaimed.has(`${booking.id}:${reminderType}`)) continue
      if (!isReminderEligible(appointmentStartUtc, now, reminderType)) continue

      toClaim.push({
        booking_id: booking.id,
        reminder_type: reminderType,
        status: 'pending',
        attempted_at: attemptedAt,
      })
    }
  }

  if (toClaim.length === 0) {
    return { claimed: 0, claimedRows: [] }
  }

  // Atomic claim: `ignoreDuplicates: true` makes supabase-js/PostgREST send
  // `Prefer: resolution=ignore-duplicates`, which Postgres executes as
  // `INSERT ... ON CONFLICT (booking_id, reminder_type) DO NOTHING` against
  // the unique constraint from Stage 3C. A concurrent invocation racing on
  // the same (booking_id, reminder_type) pair simply gets that row omitted
  // from its own returned set — never an error, never a duplicate row.
  const { data: claimed, error: claimError } = await reminderDeliveriesTable(supabaseAdmin)
    .upsert(toClaim, { onConflict: 'booking_id,reminder_type', ignoreDuplicates: true })
    .select('id, booking_id, reminder_type')

  if (claimError) {
    console.error('[reminders] claim insert failed:', claimError.message)
    throw new Error('Failed to claim reminders.')
  }

  const claimedRows = (claimed ?? []) as ClaimedReminderRow[]
  return { claimed: claimedRows.length, claimedRows }
}
