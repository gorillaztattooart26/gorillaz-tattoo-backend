import { supabase } from '@/lib/supabase'
import type { Booking, BookingStatus, TimelineStep } from '@/types/booking-portal'
import type { Artist } from '@/types/artist'

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
  created_at: string
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
 */
export async function getBookingByToken(token: string): Promise<Booking | null> {
  const { data, error } = await supabase.rpc('get_booking_by_token', { p_token: token })

  if (error) {
    console.error('[bookings] get_booking_by_token failed:', error)
    return null
  }
  if (!data) {
    return null
  }

  const result = data as unknown as BookingRpcResult
  const { booking: b, artist, reference_images: referenceImages } = result

  return {
    token: b.token,
    bookingId: b.booking_id,
    status: b.status,
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
      referenceImages: referenceImages.map((image) => ({
        src: image.image_path,
        alt: image.alt_text ?? 'Reference image on file for this booking',
      })),
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
    payment: null,
    timeline: buildTimeline(b.status, b.appointment_date),
    createdAt: b.created_at,
  }
}

export interface BookingRecord {
  /** Raw `bookings.id` UUID — the FK target for `payments.booking_id`. */
  id: string
  bookingId: string
  status: BookingStatus
  downPaymentAmount: number
  currency: string
  customer: { name: string; email: string; mobile: string }
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
  const { data, error } = await supabase.rpc('get_booking_by_token', { p_token: token })

  if (error || !data) {
    if (error) console.error('[bookings] get_booking_by_token failed:', error)
    return null
  }

  const { booking: b } = data as unknown as BookingRpcResult

  return {
    id: b.id,
    bookingId: b.booking_id,
    status: b.status,
    downPaymentAmount: b.down_payment_amount,
    currency: b.currency,
    customer: {
      name: b.customer_name,
      email: b.customer_email,
      mobile: b.customer_mobile,
    },
  }
}
