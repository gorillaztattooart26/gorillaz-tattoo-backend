'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { getInquiryImagePaths } from '@/lib/staff/inquiries'
import { requireOwner } from '@/lib/staff/permissions'
import { deleteReferenceImages } from '@/lib/staff/storage'

export interface InquiryActionResult {
  error?: string
}

export interface BulkInquiryActionResult {
  error?: string
  succeeded: number
}

/**
 * Archive / Restore / Delete for Inquiries — Owner-only, same convention
 * as app/staff/(protected)/bookings/actions.ts's equivalent section:
 * requireOwner() first, RLS on `inquiries`/`inquiry_images` stays
 * permissive for `authenticated` (20260808200100), so this check is the
 * real authorization boundary. Inquiries have no cancel/complete/reschedule
 * lifecycle like bookings — this is the only actions file they need.
 */

/** Hides an inquiry from the default Inquiries view — fully restorable. */
export async function archiveInquiryAction(inquiryId: string): Promise<InquiryActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const artist = await getCurrentStaffArtist()
  const supabase = await createClient()

  const { error } = await supabase
    .from('inquiries')
    .update({ archived_at: new Date().toISOString(), archived_by: artist?.id ?? null })
    .eq('id', inquiryId)
    .is('archived_at', null)

  if (error) {
    console.error('[staff/inquiries] archive failed:', error)
    return { error: 'Something went wrong archiving this inquiry. Please try again.' }
  }

  revalidatePath('/staff/inquiries')
  return {}
}

/** Brings an archived inquiry back to the default Inquiries view. */
export async function restoreInquiryAction(inquiryId: string): Promise<InquiryActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('inquiries')
    .update({ archived_at: null, archived_by: null })
    .eq('id', inquiryId)

  if (error) {
    console.error('[staff/inquiries] restore failed:', error)
    return { error: 'Something went wrong restoring this inquiry. Please try again.' }
  }

  revalidatePath('/staff/inquiries')
  return {}
}

/** Permanently deletes an inquiry, its inquiry_images rows (cascade), and their Storage objects. Inquiries have no downstream financial record, so — unlike bookings — nothing blocks this. */
export async function deleteInquiryAction(inquiryId: string): Promise<InquiryActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const imagePaths = await getInquiryImagePaths(inquiryId)

  const supabase = await createClient()
  const { error } = await supabase.from('inquiries').delete().eq('id', inquiryId)

  if (error) {
    console.error('[staff/inquiries] delete failed:', error)
    return { error: 'Something went wrong deleting this inquiry. Please try again.' }
  }

  await deleteReferenceImages(imagePaths)

  revalidatePath('/staff/inquiries')
  return {}
}

export async function bulkArchiveInquiriesAction(inquiryIds: string[]): Promise<BulkInquiryActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0 }
  if (inquiryIds.length === 0) return { succeeded: 0 }

  const artist = await getCurrentStaffArtist()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiries')
    .update({ archived_at: new Date().toISOString(), archived_by: artist?.id ?? null })
    .in('id', inquiryIds)
    .is('archived_at', null)
    .select('id')

  if (error) {
    console.error('[staff/inquiries] bulk archive failed:', error)
    return { error: 'Something went wrong archiving these inquiries. Please try again.', succeeded: 0 }
  }

  revalidatePath('/staff/inquiries')
  return { succeeded: data?.length ?? 0 }
}

export async function bulkRestoreInquiriesAction(inquiryIds: string[]): Promise<BulkInquiryActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0 }
  if (inquiryIds.length === 0) return { succeeded: 0 }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiries')
    .update({ archived_at: null, archived_by: null })
    .in('id', inquiryIds)
    .select('id')

  if (error) {
    console.error('[staff/inquiries] bulk restore failed:', error)
    return { error: 'Something went wrong restoring these inquiries. Please try again.', succeeded: 0 }
  }

  revalidatePath('/staff/inquiries')
  return { succeeded: data?.length ?? 0 }
}

export async function bulkDeleteInquiriesAction(inquiryIds: string[]): Promise<BulkInquiryActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0 }
  if (inquiryIds.length === 0) return { succeeded: 0 }

  const imagePathsByInquiry = await Promise.all(inquiryIds.map((id) => getInquiryImagePaths(id)))
  const allImagePaths = imagePathsByInquiry.flat()

  const supabase = await createClient()
  const { data, error } = await supabase.from('inquiries').delete().in('id', inquiryIds).select('id')

  if (error) {
    console.error('[staff/inquiries] bulk delete failed:', error)
    return { error: 'Something went wrong deleting these inquiries. Please try again.', succeeded: 0 }
  }

  await deleteReferenceImages(allImagePaths)

  revalidatePath('/staff/inquiries')
  return { succeeded: data?.length ?? 0 }
}
