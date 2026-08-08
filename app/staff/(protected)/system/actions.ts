'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOwner } from '@/lib/staff/permissions'
import { deleteReferenceImages } from '@/lib/staff/storage'

export interface SystemActionResult<T = undefined> {
  error?: string
  data?: T
}

/**
 * Owner Tools (/staff/system) — Database Maintenance + Clear Test Data.
 * Every action here does the requireOwner() check (same convention as
 * every other data-management action file) *and* calls a `security
 * definer` Postgres function (supabase/migrations/20260808200200) that
 * re-checks ownership itself — this page's mutations are bulk, studio-
 * wide, and irreversible, so it gets the extra DB-level backstop the
 * per-record actions don't need.
 */

export interface TestDataCounts {
  bookings: number
  booking_reference_images: number
  inquiries: number
  inquiry_images: number
  payments: number
}

/** Record counts shown before the "Clear Test Data" confirmation gate unlocks. */
export async function getTestDataCountsAction(): Promise<SystemActionResult<TestDataCounts>> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_test_data_counts')

  if (error) {
    console.error('[staff/system] getTestDataCountsAction failed:', error)
    return { error: 'Something went wrong loading record counts. Please try again.' }
  }
  return { data: data as unknown as TestDataCounts }
}

/**
 * Wipes every booking/inquiry/payment (+ their images, in the DB and in
 * Storage) in one transaction. Never touches artists, gallery, homepage
 * media, auth, or anything else outside those five tables. Requires the
 * caller to have already typed "DELETE TEST DATA" — enforced client-side
 * in ClearTestDataPanel, and this action re-checks the phrase too so the
 * safeguard can't be bypassed by calling the action directly.
 */
export async function clearTestDataAction(confirmationPhrase: string): Promise<SystemActionResult<TestDataCounts>> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  if (confirmationPhrase !== 'DELETE TEST DATA') {
    return { error: 'Type "DELETE TEST DATA" exactly to confirm.' }
  }

  const supabase = await createClient()

  const [{ data: bookingImages }, { data: inquiryImages }] = await Promise.all([
    supabase.from('booking_reference_images').select('image_path'),
    supabase.from('inquiry_images').select('image_path'),
  ])

  const { data, error } = await supabase.rpc('clear_test_data')

  if (error) {
    console.error('[staff/system] clearTestDataAction failed:', error)
    return { error: 'Something went wrong clearing test data. Please try again.' }
  }

  const allPaths = [...(bookingImages ?? []), ...(inquiryImages ?? [])].map((row) => row.image_path)
  await deleteReferenceImages(allPaths)

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/inquiries')
  revalidatePath('/staff/payments')
  revalidatePath('/staff/dashboard')
  revalidatePath('/staff/system')

  return { data: data as unknown as TestDataCounts }
}

/** Archives every `completed` booking older than the given number of months. */
export async function archiveOldCompletedBookingsAction(months: number): Promise<SystemActionResult<number>> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('archive_completed_bookings_older_than', { p_months: months })

  if (error) {
    console.error('[staff/system] archiveOldCompletedBookingsAction failed:', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/system')
  return { data: data as unknown as number }
}

/** Permanently deletes archived inquiries (+ images) older than the given number of months. */
export async function deleteOldArchivedInquiriesAction(months: number): Promise<SystemActionResult<number>> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('delete_archived_inquiries_older_than', { p_months: months })

  if (error) {
    console.error('[staff/system] deleteOldArchivedInquiriesAction failed:', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  const result = data as unknown as { deleted: number; image_paths: string[] }
  await deleteReferenceImages(result.image_paths ?? [])

  revalidatePath('/staff/inquiries')
  revalidatePath('/staff/system')
  return { data: result.deleted }
}

/** Permanently deletes archived bookings (+ images) older than the given number of months — skips any that still have payments. */
export async function deleteOldArchivedBookingsAction(
  months: number,
): Promise<SystemActionResult<{ deleted: number; skippedHasPayments: number }>> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('delete_archived_bookings_older_than', { p_months: months })

  if (error) {
    console.error('[staff/system] deleteOldArchivedBookingsAction failed:', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  const result = data as unknown as { deleted: number; skipped_has_payments: number; image_paths: string[] }
  await deleteReferenceImages(result.image_paths ?? [])

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/system')
  return { data: { deleted: result.deleted, skippedHasPayments: result.skipped_has_payments } }
}

/** Permanently deletes archived pending/failed payments older than the given number of months. */
export async function deleteOldArchivedPendingPaymentsAction(months: number): Promise<SystemActionResult<number>> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('delete_archived_pending_payments_older_than', { p_months: months })

  if (error) {
    console.error('[staff/system] deleteOldArchivedPendingPaymentsAction failed:', error)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/staff/payments')
  revalidatePath('/staff/system')
  return { data: data as unknown as number }
}
