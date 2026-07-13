import { createClient } from '@/lib/supabase/server'
import type { PaymentRow } from '@/types/supabase'

export interface StaffPayment {
  id: string
  bookingRef: string
  customerName: string
  amount: number
  currency: string
  status: string
  method: string | null
  paidAt: string | null
  createdAt: string
}

/** See lib/staff/bookings.ts's BookingWithArtistRow for why this is manual. */
interface PaymentWithBookingRow extends PaymentRow {
  bookings: { booking_id: string; customer_name: string } | null
}

function mapPayment(row: PaymentWithBookingRow): StaffPayment {
  return {
    id: row.id,
    bookingRef: row.bookings?.booking_id ?? 'Unknown',
    customerName: row.bookings?.customer_name ?? 'Unknown',
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    method: row.method,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }
}

export async function getPayments(): Promise<StaffPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, bookings(booking_id, customer_name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[staff/payments] getPayments failed:', error)
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

export async function getPaymentCounts(): Promise<PaymentCounts> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('payments').select('status')

  const counts: PaymentCounts = { total: 0, paid: 0, pending: 0, failed: 0, refunded: 0 }

  if (error || !data) {
    if (error) console.error('[staff/payments] getPaymentCounts failed:', error)
    return counts
  }

  counts.total = data.length
  for (const row of data) {
    if (row.status === 'paid') counts.paid++
    else if (row.status === 'pending') counts.pending++
    else if (row.status === 'failed') counts.failed++
    else if (row.status === 'refunded') counts.refunded++
  }
  return counts
}
