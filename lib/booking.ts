import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { WAIVER_VERSION, WAIVER_TEXT } from '@/lib/policy'
import type { Booking, BookingStatus, TimelineStep } from '@/types/booking-portal'
import type { Artist } from '@/types/artist'

/**
 * SHA-256 of the canonical WAIVER_TEXT (lib/policy.ts) — deliberately not
 * a hash of rendered HTML/JSX, so it stays deterministic across styling
 * or markup changes and only moves when the actual waiver wording (and
 * WAIVER_VERSION alongside it) changes. Server-only (node:crypto) and
 * never accepts input — the server is the only party that computes this,
 * never the client.
 */
export function computeWaiverHash(): string {
  return createHash('sha256').update(WAIVER_TEXT, 'utf8').digest('hex')
}

function buildTimeline(status: BookingStatus, appointmentDate: string): TimelineStep[] {
  const today = new Date().toISOString().slice(0, 10)
  const isConfirmed = status === 'appointment_confirmed' || status === 'completed'
  const isCompleted = status === 'completed'

  return [
    {
      key: 'consultation_completed',
      label: 'Consultation Completed',
      description: 'The consultation with the artist has been completed.',
      status: 'complete',
      date: today,
    },
    {
      key: 'tattoo_approved',
      label: 'Tattoo Approved',
      description: 'The final design and quote were approved by the studio.',
      status: 'complete',
      date: today,
    },
    {
      key: 'awaiting_down_payment',
      label: 'Awaiting Down Payment',
      description: 'Reserve your appointment by completing the required down payment.',
      status: isConfirmed ? 'complete' : 'current',
      date: isConfirmed ? today : null,
    },
    {
      key: 'appointment_confirmed',
      label: 'Appointment Confirmed',
      description: 'Your session slot is locked in once the down payment clears.',
      status: isCompleted ? 'complete' : isConfirmed ? 'current' : 'upcoming',
      date: isConfirmed ? today : null,
    },
    {
      key: 'tattoo_session',
      label: 'Tattoo Session',
      description: 'Time to get inked.',
      status: isCompleted ? 'complete' : 'upcoming',
      date: appointmentDate,
    },
  ]
}

interface BookingRpcRow {
  id: string
  token: string
  booking_id: string
  status: BookingStatus
  customer_name: string
  customer_email: string
  customer_mobile: string
  preferred_contact_method: 'email' | 'sms' | 'call' | 'messenger'
  tattoo_description: string
  tattoo_style: string
  placement: string
  estimated_size: string
  estimated_session_hours: number
  estimated_session_count: number
  studio_address: string
  appointment_date: string
  appointment_time: string
  consultation_method: string
  currency: string
  estimated_price: number
  down_payment_percent: number
  down_payment_amount: number
  remaining_balance: number
  waiver_accepted: boolean
  waiver_accepted_at: string | null
  waiver_version: string | null
  created_at: string
  /** Already present in `bookings` (Stage 6 archive feature) and already returned by `get_booking_by_token`'s `to_jsonb(b)` — just not previously read into these row shapes. */
  archived_at: string | null
}

interface ArtistRpcRow {
  slug: string
  name: string
  specialty: string
  years: string
  bio: string
  image_path: string
  instagram_url: string | null
  facebook_url: string | null
}

interface ReferenceImageRpcRow {
  image_path: string
  alt_text: string | null
}

interface BookingRpcResult {
  booking: BookingRpcRow
  artist: ArtistRpcRow
  reference_images: ReferenceImageRpcRow[]
}

function mapArtist(row: ArtistRpcRow): Artist {
  return {
    slug: row.slug,
    src: row.image_path,
    name: row.name,
    specialty: row.specialty,
    years: row.years,
    bio: row.bio,
    instagram: row.instagram_url ?? '',
    facebook: row.facebook_url ?? '',
    alt: `${row.name} — ${row.specialty} tattoo artist at gorillaz tattoo art studio philippines`,
  }
}

/**
 * Reads a booking via the `get_booking_by_token` Postgres function rather
 * than `.from('bookings').select()` — `bookings` deliberately has no SELECT
 * policy for the anon role (only INSERT), so a broad read policy can't leak
 * the full customer/appointment list via the REST API. The function is
 * SECURITY DEFINER and only ever returns data for the exact token supplied,
 * an unguessable UUID.
 *
 * Called with the service-role client, not the anon client: EXECUTE on this
 * function is no longer granted to `anon`/`authenticated` (see migration
 * 20260805020818) specifically so it can't be invoked directly through the
 * public REST API. This module is the only intended caller, and every
 * caller of it in turn is trusted server-only code (Server Components /
 * Server Actions never bundled to the client) — never call these exports
 * from anywhere a browser could reach before its own request is verified.
 */
export async function getBookingByToken(token: string): Promise<Booking | null> {
  const { data, error } = await getSupabaseAdmin().rpc('get_booking_by_token', { p_token: token })

  if (error) {
    console.error('[bookings] get_booking_by_token failed:', error)
    return null
  }
  if (!data) {
    return null
  }

  const result = data as unknown as BookingRpcResult
  const { booking: b, artist } = result

  return {
    token: b.token,
    bookingId: b.booking_id,
    status: b.status,
    isArchived: b.archived_at !== null,
    customer: {
      name: b.customer_name,
      email: b.customer_email,
      mobile: b.customer_mobile,
      preferredContactMethod: b.preferred_contact_method,
    },
    artist: mapArtist(artist),
    tattoo: {
      description: b.tattoo_description,
      style: b.tattoo_style,
      placement: b.placement,
      estimatedSize: b.estimated_size,
      estimatedSessionHours: b.estimated_session_hours,
      estimatedSessionCount: b.estimated_session_count,
    },
    appointment: {
      studioAddress: b.studio_address,
      date: b.appointment_date,
      time: b.appointment_time,
      consultationMethod: b.consultation_method,
      mapUrl: `https://maps.google.com/?q=${encodeURIComponent(b.studio_address)}`,
      directionsUrl: `https://maps.google.com/dir/?api=1&destination=${encodeURIComponent(b.studio_address)}`,
    },
    invoice: {
      currency: b.currency,
      estimatedPrice: b.estimated_price,
      downPaymentPercent: b.down_payment_percent,
      downPaymentAmount: b.down_payment_amount,
      remainingBalance: b.remaining_balance,
    },
    waiver: {
      accepted: b.waiver_accepted,
      version: b.waiver_version,
      acceptedAt: b.waiver_accepted_at,
    },
    payment: null,
    timeline: buildTimeline(b.status, b.appointment_date),
    createdAt: b.created_at,
  }
}

/**
 * Existence-only check used before identity verification. Still calls the
 * same RPC internally (there's no narrower SELECT path available under the
 * current RLS policies — `bookings` has no anon SELECT policy), but the
 * result is collapsed to a boolean here and never leaves this function, so
 * no customer/booking data reaches the caller pre-verification.
 */
export async function bookingTokenExists(token: string): Promise<boolean> {
  const record = await getBookingRecordByToken(token)
  return record !== null
}

export interface BookingRecord {
  /** Raw `bookings.id` UUID — the FK target for `payments.booking_id`. */
  id: string
  bookingId: string
  status: BookingStatus
  /** Whether staff have archived this booking — an archived booking must never be allowed to start or complete checkout, regardless of `status`. See createCheckoutSessionAction. */
  isArchived: boolean
  downPaymentAmount: number
  currency: string
  customer: { name: string; email: string; mobile: string }
  /** Whether waiver acceptance is already recorded for this booking — lets the checkout action skip re-validating/re-recording on a payment retry. */
  waiverAccepted: boolean
}

/**
 * Thin counterpart to `getBookingByToken()` for internal (non-display)
 * callers, like the checkout Server Action, that need the raw `bookings.id`
 * primary key and the authoritative down payment amount — re-derived from
 * the DB rather than trusted from client input. Deliberately not merged
 * into `Booking` (the shape every display component consumes) to avoid
 * threading an internal DB id through unrelated UI code.
 */
export async function getBookingRecordByToken(token: string): Promise<BookingRecord | null> {
  const { data, error } = await getSupabaseAdmin().rpc('get_booking_by_token', { p_token: token })

  if (error || !data) {
    if (error) console.error('[bookings] get_booking_by_token failed:', error)
    return null
  }

  const { booking: b } = data as unknown as BookingRpcResult

  return {
    id: b.id,
    bookingId: b.booking_id,
    status: b.status,
    isArchived: b.archived_at !== null,
    downPaymentAmount: b.down_payment_amount,
    currency: b.currency,
    customer: {
      name: b.customer_name,
      email: b.customer_email,
      mobile: b.customer_mobile,
    },
    waiverAccepted: b.waiver_accepted,
  }
}

export interface WaiverAcceptanceInput {
  ip: string | null
  userAgent: string | null
}

/**
 * Records waiver acceptance on a booking, server-side, before any
 * PayMongo checkout session is created (see createCheckoutSessionAction).
 * Idempotent via `.eq('waiver_accepted', false)` — a retried payment
 * attempt (booking already has an accepted waiver) is a no-op rather than
 * overwriting the original acceptance timestamp/IP with a later one.
 *
 * Uses the service-role client because `anon` has no UPDATE grant on
 * `bookings` (migration 20260805025944 revoked it, and no RLS UPDATE
 * policy exists for `anon` either). Safe despite bypassing RLS: `bookingId`
 * here is always the internal UUID already resolved by
 * `getBookingRecordByToken()`, itself gated by the unguessable booking
 * token — this call is scoped to exactly one row the caller has already
 * proven it may act on, not an open table write.
 */
export async function recordWaiverAcceptance(
  bookingId: string,
  input: WaiverAcceptanceInput,
): Promise<boolean> {
  const { error } = await getSupabaseAdmin()
    .from('bookings')
    .update({
      waiver_accepted: true,
      waiver_accepted_at: new Date().toISOString(),
      waiver_version: WAIVER_VERSION,
      waiver_hash: computeWaiverHash(),
      waiver_ip: input.ip,
      waiver_user_agent: input.userAgent,
    })
    .eq('id', bookingId)
    .eq('waiver_accepted', false)

  if (error) {
    console.error('[bookings] recordWaiverAcceptance failed:', error)
    return false
  }
  return true
}

export interface LatestPaymentAttempt {
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  method: string | null
  createdAt: string
}

/**
 * Read-only lookup of a booking's most recent payment attempt, for the
 * Payment Failed page to show what actually happened (still pending
 * server-side confirmation vs. a confirmed decline) instead of guessing
 * from the booking status alone. Pure addition alongside the existing
 * booking reads above — doesn't touch payment creation, the webhook, or
 * any status-transition logic.
 *
 * `bookingId` here is always the internal UUID already resolved by
 * `getBookingRecordByToken()` (itself gated by the unguessable token),
 * never a raw value from the request — same trust boundary as every
 * other admin-client read in this file.
 */
export async function getLatestPaymentAttempt(bookingId: string): Promise<LatestPaymentAttempt | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('payments')
    .select('status, method, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[bookings] getLatestPaymentAttempt failed:', error)
    return null
  }
  if (!data) return null

  return {
    status: data.status as LatestPaymentAttempt['status'],
    method: data.method,
    createdAt: data.created_at,
  }
}
