import { createClient } from '@/lib/supabase/server'
import type { PaymentRow } from '@/types/supabase'
import type { RecordView } from '@/lib/staff/bookings'

export interface StaffPayment {
  id: string
  bookingId: string
  bookingRef: string
  customerName: string
  amount: number
  currency: string
  status: string
  method: string | null
  paidAt: string | null
  createdAt: string
  archivedAt: string | null
}

/** Payment statuses this feature ever allows permanently deleting — never paid/refunded. See supabase/migrations/20260808200200_add_owner_maintenance_functions.sql for why 'pending'/'failed' (this schema has no separate cancelled/expired status). */
export const DELETABLE_PAYMENT_STATUSES = ['pending', 'failed'] as const

/** See lib/staff/bookings.ts's BookingWithArtistRow for why this is manual. */
interface PaymentWithBookingRow extends PaymentRow {
  bookings: { booking_id: string; customer_name: string; artist_id: string } | null
}

function mapPayment(row: PaymentWithBookingRow): StaffPayment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    bookingRef: row.bookings?.booking_id ?? 'Unknown',
    customerName: row.bookings?.customer_name ?? 'Unknown',
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    method: row.method,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  }
}

export async function getPayments(): Promise<StaffPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, bookings(booking_id, customer_name, artist_id)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[staff/payments] getPayments failed:', error)
    return []
  }
  return (data as unknown as PaymentWithBookingRow[]).map(mapPayment)
}

/**
 * Payments visible on the staff dashboard's Payments tab, scoped the same
 * way as Bookings (lib/staff/bookings.ts's getBookingsForStaffArtist):
 * owners see every payment studio-wide, everyone else only payments tied
 * to their own bookings, unlinked accounts see nothing. Filters via the
 * joined `bookings.artist_id` (`!inner` so the filter actually applies to
 * the join, not just the top-level `payments` rows) since payments have
 * no artist of their own — only their booking does.
 */
export async function getPaymentsForStaffArtist(
  artist: { id: string; is_owner: boolean } | null,
  view: RecordView = 'active',
): Promise<StaffPayment[]> {
  if (!artist) return []

  const supabase = await createClient()
  let query = supabase
    .from('payments')
    .select('*, bookings!inner(booking_id, customer_name, artist_id)')
    .order('created_at', { ascending: false })

  if (!artist.is_owner) {
    query = query.eq('bookings.artist_id', artist.id)
  }

  query = view === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null)

  const { data, error } = await query

  if (error) {
    console.error('[staff/payments] getPaymentsForStaffArtist failed:', error)
    return []
  }
  return (data as unknown as PaymentWithBookingRow[]).map(mapPayment)
}

export interface PaymentCounts {
  total: number
  paid: number
  pending: number
  failed: number
  refunded: number
}

function countPaymentStatuses(rows: { status: string }[]): PaymentCounts {
  const counts: PaymentCounts = { total: rows.length, paid: 0, pending: 0, failed: 0, refunded: 0 }
  for (const row of rows) {
    if (row.status === 'paid') counts.paid++
    else if (row.status === 'pending') counts.pending++
    else if (row.status === 'failed') counts.failed++
    else if (row.status === 'refunded') counts.refunded++
  }
  return counts
}

/** Same scoping as getPaymentsForStaffArtist. Powers the Dashboard's "Pending Payments" stat card. */
export async function getPaymentCountsForStaffArtist(
  artist: { id: string; is_owner: boolean } | null,
): Promise<PaymentCounts> {
  if (!artist) return countPaymentStatuses([])

  const supabase = await createClient()
  let query = supabase.from('payments').select('status, bookings!inner(artist_id)')

  if (!artist.is_owner) {
    query = query.eq('bookings.artist_id', artist.id)
  }

  const { data, error } = await query

  if (error || !data) {
    if (error) console.error('[staff/payments] getPaymentCountsForStaffArtist failed:', error)
    return countPaymentStatuses([])
  }
  return countPaymentStatuses(data)
}

export async function getPaymentCounts(): Promise<PaymentCounts> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('payments').select('status')

  if (error || !data) {
    if (error) console.error('[staff/payments] getPaymentCounts failed:', error)
    return countPaymentStatuses([])
  }
  return countPaymentStatuses(data)
}
