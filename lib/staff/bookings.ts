import { createClient } from '@/lib/supabase/server'
import type { BookingRow } from '@/types/supabase'

export interface StaffBooking {
  id: string
  bookingId: string
  token: string
  status: string
  customerName: string
  customerEmail: string
  artistId: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  estimatedSessionHours: number
  estimatedPrice: number
  downPaymentAmount: number
  currency: string
  createdAt: string
  archivedAt: string | null
  waiverAccepted: boolean
  waiverAcceptedAt: string | null
}

/** Which slice of a table to fetch — mirrors the Archived-view tab added to Bookings/Inquiries/Payments. */
export type RecordView = 'active' | 'archived'

/**
 * Raw shape of `bookings` joined with `artists` via the FK relationship
 * declared in types/supabase.ts. Typed manually rather than relying on
 * supabase-js's join inference — the hand-written Database type doesn't
 * reliably infer nested-select shapes the way a CLI-generated file would
 * (same reasoning as the RPC JSON types in lib/booking.ts).
 */
interface BookingWithArtistRow extends BookingRow {
  artists: { name: string } | null
}

function mapBooking(row: BookingWithArtistRow): StaffBooking {
  return {
    id: row.id,
    bookingId: row.booking_id,
    token: row.token,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    artistId: row.artist_id,
    artistName: row.artists?.name ?? 'Unknown',
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    estimatedSessionHours: row.estimated_session_hours,
    estimatedPrice: row.estimated_price,
    downPaymentAmount: row.down_payment_amount,
    currency: row.currency,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    waiverAccepted: row.waiver_accepted,
    waiverAcceptedAt: row.waiver_accepted_at,
  }
}

export async function getBookings(): Promise<StaffBooking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artists!bookings_artist_id_fkey(name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[staff/bookings] getBookings failed:', error)
    return []
  }
  return (data as unknown as BookingWithArtistRow[]).map(mapBooking)
}

/**
 * Bookings visible on the staff dashboard's Bookings tab, scoped by who's
 * logged in: owner artists (currently just Park) see every booking studio-
 * wide — each row's existing Artist column tells them whose it is — while
 * every other artist only sees bookings assigned to them. `null` (no
 * artist linked to this login) sees nothing, same as the Gallery tab's
 * "not linked yet" fallback.
 */
export async function getBookingsForStaffArtist(
  artist: { id: string; is_owner: boolean } | null,
  view: RecordView = 'active',
): Promise<StaffBooking[]> {
  if (!artist) return []

  const supabase = await createClient()
  let query = supabase.from('bookings').select('*, artists!bookings_artist_id_fkey(name)').order('created_at', { ascending: false })

  if (!artist.is_owner) {
    query = query.eq('artist_id', artist.id)
  }

  query = view === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null)

  const { data, error } = await query

  if (error) {
    console.error('[staff/bookings] getBookingsForStaffArtist failed:', error)
    return []
  }
  return (data as unknown as BookingWithArtistRow[]).map(mapBooking)
}

/** Raw storage paths for one booking's reference photos — used by Delete Booking to clean up the `references` bucket after the DB rows are gone. */
export async function getBookingReferenceImagePaths(bookingId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('booking_reference_images')
    .select('image_path')
    .eq('booking_id', bookingId)

  if (error) {
    console.error('[staff/bookings] getBookingReferenceImagePaths failed:', error)
    return []
  }
  return data.map((row) => row.image_path)
}

/** Whether a booking has any payment rows — Delete Booking must refuse when true (payments are the historical record, deleting the booking they reference would orphan them). */
export async function bookingHasPayments(bookingId: string): Promise<boolean> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)

  if (error) {
    console.error('[staff/bookings] bookingHasPayments failed:', error)
    return true // fail closed — block deletion if we can't confirm it's safe
  }
  return (count ?? 0) > 0
}

/** Same scoping as getBookingsForStaffArtist — owners see every booking, everyone else only their own, unlinked accounts see nothing. Powers the Bookings tab's "N total" header. */
export async function getRecentBookingsForStaffArtist(
  artist: { id: string; is_owner: boolean } | null,
  limit = 5,
): Promise<StaffBooking[]> {
  if (!artist) return []

  const supabase = await createClient()
  let query = supabase
    .from('bookings')
    .select('*, artists!bookings_artist_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!artist.is_owner) {
    query = query.eq('artist_id', artist.id)
  }

  const { data, error } = await query

  if (error) {
    console.error('[staff/bookings] getRecentBookingsForStaffArtist failed:', error)
    return []
  }
  return (data as unknown as BookingWithArtistRow[]).map(mapBooking)
}

export async function getRecentBookings(limit = 5): Promise<StaffBooking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artists!bookings_artist_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[staff/bookings] getRecentBookings failed:', error)
    return []
  }
  return (data as unknown as BookingWithArtistRow[]).map(mapBooking)
}

export interface BookingCounts {
  total: number
  awaitingDownPayment: number
  confirmed: number
  completed: number
  cancelled: number
}

function countStatuses(rows: { status: string }[]): BookingCounts {
  const counts: BookingCounts = { total: rows.length, awaitingDownPayment: 0, confirmed: 0, completed: 0, cancelled: 0 }
  for (const row of rows) {
    if (row.status === 'awaiting_down_payment') counts.awaitingDownPayment++
    else if (row.status === 'appointment_confirmed') counts.confirmed++
    else if (row.status === 'completed') counts.completed++
    else if (row.status === 'cancelled') counts.cancelled++
  }
  return counts
}

/** Same scoping as getBookingsForStaffArtist. Powers the Dashboard's booking stat cards. */
export async function getBookingCountsForStaffArtist(
  artist: { id: string; is_owner: boolean } | null,
): Promise<BookingCounts> {
  if (!artist) return countStatuses([])

  const supabase = await createClient()
  let query = supabase.from('bookings').select('status')

  if (!artist.is_owner) {
    query = query.eq('artist_id', artist.id)
  }

  const { data, error } = await query

  if (error || !data) {
    if (error) console.error('[staff/bookings] getBookingCountsForStaffArtist failed:', error)
    return countStatuses([])
  }
  return countStatuses(data)
}

export async function getBookingCounts(): Promise<BookingCounts> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('bookings').select('status')

  if (error || !data) {
    if (error) console.error('[staff/bookings] getBookingCounts failed:', error)
    return countStatuses([])
  }
  return countStatuses(data)
}
