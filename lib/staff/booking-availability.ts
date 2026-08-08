import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Parses an appointment time into minutes-since-midnight, for comparing
 * two bookings' time ranges. Supports both formats the `appointment_time`
 * column has ever held: `<input type="time">`'s 24h "HH:MM" and the
 * legacy free-text "2:00 PM" style the field originally accepted. Returns
 * null for anything else — callers should skip conflict-checking against
 * an unparseable row rather than block a booking over it.
 */
export function parseTimeToMinutes(time: string): number | null {
  const trimmed = time.trim()

  const militaryMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (militaryMatch) {
    return Number(militaryMatch[1]) * 60 + Number(militaryMatch[2])
  }

  const ampmMatch = trimmed.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)$/i)
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]) % 12
    const minutes = ampmMatch[2] ? Number(ampmMatch[2]) : 0
    if (/pm/i.test(ampmMatch[3])) hours += 12
    return hours * 60 + minutes
  }

  return null
}

/** Bookings in these statuses hold a real calendar slot; cancelled/failed ones don't block new bookings from reusing the time. */
const ACTIVE_STATUSES = ['awaiting_down_payment', 'appointment_confirmed']

export interface ConflictCheckParams {
  artistId: string
  date: string
  time: string
  durationHours: number
  /** Exclude this booking's own row — pass the booking being rescheduled so it doesn't conflict with itself. */
  excludeBookingId?: string
}

export interface ConflictResult {
  hasConflict: boolean
  conflictingBookingRef?: string
}

/**
 * Best-effort double-booking guard for one artist's calendar: compares
 * [start, start+duration) for the candidate slot against every other
 * active booking for the same artist on the same date. Takes the caller's
 * Supabase client rather than constructing its own — the staff session
 * client already has SELECT on `bookings` (proven by the Bookings tab),
 * so no new RLS policy is needed for this check.
 */
export async function checkBookingConflict(
  supabase: SupabaseClient<Database>,
  params: ConflictCheckParams,
): Promise<ConflictResult> {
  const newStart = parseTimeToMinutes(params.time)
  if (newStart === null) return { hasConflict: false }
  const newEnd = newStart + params.durationHours * 60

  let query = supabase
    .from('bookings')
    .select('booking_id, appointment_time, estimated_session_hours')
    .eq('artist_id', params.artistId)
    .eq('appointment_date', params.date)
    .in('status', ACTIVE_STATUSES)

  if (params.excludeBookingId) {
    query = query.neq('id', params.excludeBookingId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[staff/booking-availability] conflict check failed:', error)
    return { hasConflict: false }
  }

  for (const row of data ?? []) {
    const existingStart = parseTimeToMinutes(row.appointment_time)
    if (existingStart === null) continue
    const existingEnd = existingStart + row.estimated_session_hours * 60
    if (newStart < existingEnd && existingStart < newEnd) {
      return { hasConflict: true, conflictingBookingRef: row.booking_id }
    }
  }

  return { hasConflict: false }
}
