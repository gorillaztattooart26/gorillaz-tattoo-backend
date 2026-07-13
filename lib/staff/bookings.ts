import { createClient } from '@/lib/supabase/server'
import type { BookingRow } from '@/types/supabase'

export interface StaffBooking {
  id: string
  bookingId: string
  status: string
  customerName: string
  customerEmail: string
  artistName: string
  appointmentDate: string
  appointmentTime: string
  estimatedPrice: number
  downPaymentAmount: number
  currency: string
  createdAt: string
}

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
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    artistName: row.artists?.name ?? 'Unknown',
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    estimatedPrice: row.estimated_price,
    downPaymentAmount: row.down_payment_amount,
    currency: row.currency,
    createdAt: row.created_at,
  }
}

export async function getBookings(): Promise<StaffBooking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artists(name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[staff/bookings] getBookings failed:', error)
    return []
  }
  return (data as unknown as BookingWithArtistRow[]).map(mapBooking)
}

export async function getRecentBookings(limit = 5): Promise<StaffBooking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, artists(name)')
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

export async function getBookingCounts(): Promise<BookingCounts> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('bookings').select('status')

  const counts: BookingCounts = {
    total: 0,
    awaitingDownPayment: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  }

  if (error || !data) {
    if (error) console.error('[staff/bookings] getBookingCounts failed:', error)
    return counts
  }

  counts.total = data.length
  for (const row of data) {
    if (row.status === 'awaiting_down_payment') counts.awaitingDownPayment++
    else if (row.status === 'appointment_confirmed') counts.confirmed++
    else if (row.status === 'completed') counts.completed++
    else if (row.status === 'cancelled') counts.cancelled++
  }
  return counts
}
