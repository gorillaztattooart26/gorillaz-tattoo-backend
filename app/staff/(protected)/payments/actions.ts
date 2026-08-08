'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { DELETABLE_PAYMENT_STATUSES } from '@/lib/staff/payments'
import { requireOwner } from '@/lib/staff/permissions'

export interface PaymentActionResult {
  error?: string
}

export interface BulkPaymentActionResult {
  error?: string
  succeeded: number
  skipped: { id: string; reason: string }[]
}

const NOT_DELETABLE_ERROR =
  'Only pending or failed payments can be permanently deleted — paid and refunded payments are the studio’s financial record and must be kept. Archive it instead.'

/**
 * Archive / Restore / Delete for Payments — Owner-only, same convention as
 * bookings/inquiries. Delete additionally enforces a status allow-list
 * (DELETABLE_PAYMENT_STATUSES, lib/staff/payments.ts): a paid or refunded
 * payment can never be permanently deleted, only archived. There's no
 * Storage cleanup here — payments have no attached images.
 */

/** Hides a payment from the default Payments view — fully restorable. */
export async function archivePaymentAction(paymentId: string): Promise<PaymentActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const artist = await getCurrentStaffArtist()
  const supabase = await createClient()

  const { error } = await supabase
    .from('payments')
    .update({ archived_at: new Date().toISOString(), archived_by: artist?.id ?? null })
    .eq('id', paymentId)
    .is('archived_at', null)

  if (error) {
    console.error('[staff/payments] archive failed:', error)
    return { error: 'Something went wrong archiving this payment. Please try again.' }
  }

  revalidatePath('/staff/payments')
  return {}
}

/** Brings an archived payment back to the default Payments view. */
export async function restorePaymentAction(paymentId: string): Promise<PaymentActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('payments')
    .update({ archived_at: null, archived_by: null })
    .eq('id', paymentId)

  if (error) {
    console.error('[staff/payments] restore failed:', error)
    return { error: 'Something went wrong restoring this payment. Please try again.' }
  }

  revalidatePath('/staff/payments')
  return {}
}

/** Permanently deletes a payment — refuses unless its status is pending or failed (see DELETABLE_PAYMENT_STATUSES). */
export async function deletePaymentAction(paymentId: string): Promise<PaymentActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', paymentId)
    .maybeSingle()

  if (fetchError || !payment) {
    console.error('[staff/payments] delete lookup failed:', fetchError)
    return { error: 'Payment not found.' }
  }

  if (!DELETABLE_PAYMENT_STATUSES.includes(payment.status as (typeof DELETABLE_PAYMENT_STATUSES)[number])) {
    return { error: NOT_DELETABLE_ERROR }
  }

  const { error: deleteError } = await supabase.from('payments').delete().eq('id', paymentId)
  if (deleteError) {
    console.error('[staff/payments] delete failed:', deleteError)
    return { error: 'Something went wrong deleting this payment. Please try again.' }
  }

  revalidatePath('/staff/payments')
  return {}
}

export async function bulkArchivePaymentsAction(paymentIds: string[]): Promise<BulkPaymentActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0, skipped: [] }
  if (paymentIds.length === 0) return { succeeded: 0, skipped: [] }

  const artist = await getCurrentStaffArtist()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .update({ archived_at: new Date().toISOString(), archived_by: artist?.id ?? null })
    .in('id', paymentIds)
    .is('archived_at', null)
    .select('id')

  if (error) {
    console.error('[staff/payments] bulk archive failed:', error)
    return { error: 'Something went wrong archiving these payments. Please try again.', succeeded: 0, skipped: [] }
  }

  revalidatePath('/staff/payments')
  return { succeeded: data?.length ?? 0, skipped: [] }
}

export async function bulkRestorePaymentsAction(paymentIds: string[]): Promise<BulkPaymentActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0, skipped: [] }
  if (paymentIds.length === 0) return { succeeded: 0, skipped: [] }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .update({ archived_at: null, archived_by: null })
    .in('id', paymentIds)
    .select('id')

  if (error) {
    console.error('[staff/payments] bulk restore failed:', error)
    return { error: 'Something went wrong restoring these payments. Please try again.', succeeded: 0, skipped: [] }
  }

  revalidatePath('/staff/payments')
  return { succeeded: data?.length ?? 0, skipped: [] }
}

/** Deletes every selected payment whose status allows it (pending/failed); paid/refunded payments are skipped and reported back rather than failing the whole batch. */
export async function bulkDeletePaymentsAction(paymentIds: string[]): Promise<BulkPaymentActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0, skipped: [] }
  if (paymentIds.length === 0) return { succeeded: 0, skipped: [] }

  const supabase = await createClient()
  const { data: payments, error: fetchError } = await supabase
    .from('payments')
    .select('id, status')
    .in('id', paymentIds)

  if (fetchError || !payments) {
    console.error('[staff/payments] bulk delete lookup failed:', fetchError)
    return { error: 'Something went wrong. Please try again.', succeeded: 0, skipped: [] }
  }

  const skipped: { id: string; reason: string }[] = []
  const deletable: string[] = []
  for (const payment of payments) {
    if (DELETABLE_PAYMENT_STATUSES.includes(payment.status as (typeof DELETABLE_PAYMENT_STATUSES)[number])) {
      deletable.push(payment.id)
    } else {
      skipped.push({ id: payment.id, reason: `status is "${payment.status}"` })
    }
  }

  if (deletable.length === 0) {
    return { succeeded: 0, skipped }
  }

  const { data, error } = await supabase.from('payments').delete().in('id', deletable).select('id')

  if (error) {
    console.error('[staff/payments] bulk delete failed:', error)
    return { error: 'Something went wrong deleting these payments. Please try again.', succeeded: 0, skipped: [] }
  }

  revalidatePath('/staff/payments')
  return { succeeded: data?.length ?? 0, skipped }
}
