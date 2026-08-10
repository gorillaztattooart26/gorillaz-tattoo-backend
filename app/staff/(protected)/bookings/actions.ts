'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { checkBookingConflict } from '@/lib/staff/booking-availability'
import { requireOwner } from '@/lib/staff/permissions'
import { bookingHasPayments, getBookingReferenceImagePaths } from '@/lib/staff/bookings'
import { deleteReferenceImages } from '@/lib/staff/storage'
import { getBaseUrl } from '@/lib/url'
import {
  sendStaffBookingCancelledNotification,
  sendStaffBookingRescheduledNotification,
  sendCustomerBookingCancelledEmail,
  sendCustomerBookingRescheduledEmail,
} from '@/lib/emails'

export interface BookingActionResult {
  error?: string
}

interface BookingForAction {
  id: string
  token: string
  booking_id: string
  status: string
  customer_name: string
  customer_email: string
  artist_id: string
  appointment_date: string
  appointment_time: string
  estimated_session_hours: number
  artists: { name: string } | null
}

/**
 * Shared guard for every mutation below: confirms there's a logged-in
 * staff account with an artist link, the booking exists, and — mirroring
 * the read-side scoping in lib/staff/bookings.ts — that the caller either
 * owns this booking or is the studio owner. RLS (once the UPDATE policy
 * from supabase-add-bookings-staff-write-access.sql is applied) is the
 * hard backstop; this is the same defense-in-depth double-check the rest
 * of the staff area already does (see the protected layout re-verifying
 * auth even though middleware already ran).
 */
async function authorizeBookingAction(
  bookingId: string,
): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; booking: BookingForAction; staffLabel: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in to do this.' }
  }

  const artist = await getCurrentStaffArtist()
  if (!artist) {
    return { ok: false, error: "Your account isn't linked to an artist yet." }
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      'id, token, booking_id, status, customer_name, customer_email, artist_id, appointment_date, appointment_time, estimated_session_hours, artists!bookings_artist_id_fkey(name)',
    )
    .eq('id', bookingId)
    .maybeSingle()

  if (error || !booking) {
    console.error('[staff/bookings] booking lookup failed:', error)
    return { ok: false, error: 'Booking not found.' }
  }

  if (!artist.is_owner && booking.artist_id !== artist.id) {
    return { ok: false, error: "This booking isn't assigned to you." }
  }

  return {
    ok: true,
    supabase,
    booking: booking as unknown as BookingForAction,
    staffLabel: user.email ?? 'a staff member',
  }
}

/** Cancels a booking — payment records are untouched (see `payments`, which is never written to here), only `bookings.status` changes. */
export async function cancelBookingAction(bookingId: string): Promise<BookingActionResult> {
  const auth = await authorizeBookingAction(bookingId)
  if (!auth.ok) return { error: auth.error }
  const { supabase, booking, staffLabel } = auth

  if (booking.status === 'cancelled') return {}

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[staff/bookings] cancel failed:', updateError)
    return { error: 'Something went wrong cancelling this booking. Please try again.' }
  }

  console.log(
    `[booking-audit] ${booking.booking_id} cancelled by ${staffLabel} — was ${booking.appointment_date} ${booking.appointment_time}`,
  )

  await sendStaffBookingCancelledNotification({
    bookingId: booking.booking_id,
    customerName: booking.customer_name,
    artistName: booking.artists?.name ?? 'Unknown artist',
    appointmentDate: booking.appointment_date,
    appointmentTime: booking.appointment_time,
    cancelledBy: staffLabel,
  })

  await sendCustomerBookingCancelledEmail({
    to: booking.customer_email,
    customerName: booking.customer_name,
    bookingId: booking.booking_id,
    artistName: booking.artists?.name ?? 'the studio',
    appointmentDate: booking.appointment_date,
    appointmentTime: booking.appointment_time,
  })

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return {}
}

/** Marks a booking completed — the tattoo session happened, nothing else about the record changes. */
export async function completeBookingAction(bookingId: string): Promise<BookingActionResult> {
  const auth = await authorizeBookingAction(bookingId)
  if (!auth.ok) return { error: auth.error }
  const { supabase, booking, staffLabel } = auth

  if (booking.status === 'completed') return {}

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[staff/bookings] complete failed:', updateError)
    return { error: 'Something went wrong updating this booking. Please try again.' }
  }

  console.log(`[booking-audit] ${booking.booking_id} marked completed by ${staffLabel}`)

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return {}
}

/** Reschedules a booking to a new date/time, guarded by the same double-booking check Create Booking uses. */
export async function rescheduleBookingAction(
  bookingId: string,
  newDate: string,
  newTime: string,
): Promise<BookingActionResult> {
  if (!newDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(newTime)) {
    return { error: 'Pick a valid date and time.' }
  }

  const auth = await authorizeBookingAction(bookingId)
  if (!auth.ok) return { error: auth.error }
  const { supabase, booking, staffLabel } = auth

  const conflict = await checkBookingConflict(supabase, {
    artistId: booking.artist_id,
    date: newDate,
    time: newTime,
    durationHours: booking.estimated_session_hours,
    excludeBookingId: booking.id,
  })

  if (conflict.hasConflict) {
    return {
      error: `This artist already has a booking (${conflict.conflictingBookingRef}) that overlaps the new time. Pick a different slot.`,
    }
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ appointment_date: newDate, appointment_time: newTime, updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[staff/bookings] reschedule failed:', updateError)
    return { error: 'Something went wrong rescheduling this booking. Please try again.' }
  }

  console.log(
    `[booking-audit] ${booking.booking_id} rescheduled by ${staffLabel} — ${booking.appointment_date} ${booking.appointment_time} -> ${newDate} ${newTime}`,
  )

  await sendStaffBookingRescheduledNotification({
    bookingId: booking.booking_id,
    customerName: booking.customer_name,
    artistName: booking.artists?.name ?? 'Unknown artist',
    oldDate: booking.appointment_date,
    oldTime: booking.appointment_time,
    newDate,
    newTime,
    rescheduledBy: staffLabel,
  })

  const baseUrl = await getBaseUrl()
  await sendCustomerBookingRescheduledEmail({
    to: booking.customer_email,
    customerName: booking.customer_name,
    bookingId: booking.booking_id,
    artistName: booking.artists?.name ?? 'the studio',
    oldDate: booking.appointment_date,
    oldTime: booking.appointment_time,
    newDate,
    newTime,
    bookingUrl: `${baseUrl}/booking/${booking.token}`,
  })

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return {}
}

// ---------------------------------------------------------------------------
// Archive / Restore / Delete — Owner-only data management. Unlike
// cancel/complete/reschedule above (any assigned artist, ownership check
// inside authorizeBookingAction), every action below is gated by
// requireOwner() first — archiving or deleting records is an Owner-only
// capability per the data-management feature spec, enforced here
// server-side (Server Actions can't be bypassed by hiding a button). RLS
// on these tables is intentionally permissive (see 20260808200100's
// migration comment) — this requireOwner() check is the actual
// authorization boundary, same convention as gallery/homepage-actions.ts.
// ---------------------------------------------------------------------------

export interface BulkBookingActionResult {
  error?: string
  succeeded: number
  skipped: { id: string; reason: string }[]
}

/** Hides a booking from the default Bookings view without touching its payments or reference images — fully restorable. */
export async function archiveBookingAction(bookingId: string): Promise<BookingActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const artist = await getCurrentStaffArtist()
  const supabase = await createClient()

  const { error } = await supabase
    .from('bookings')
    .update({ archived_at: new Date().toISOString(), archived_by: artist?.id ?? null })
    .eq('id', bookingId)
    .is('archived_at', null)

  if (error) {
    console.error('[staff/bookings] archive failed:', error)
    return { error: 'Something went wrong archiving this booking. Please try again.' }
  }

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return {}
}

/** Brings an archived booking back to the default Bookings view. */
export async function restoreBookingAction(bookingId: string): Promise<BookingActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ archived_at: null, archived_by: null })
    .eq('id', bookingId)

  if (error) {
    console.error('[staff/bookings] restore failed:', error)
    return { error: 'Something went wrong restoring this booking. Please try again.' }
  }

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return {}
}

/**
 * Permanently deletes a booking, its reference-image rows (cascade), and
 * their Storage objects — refuses if any payment references this booking,
 * since payments are the studio's financial record and must never be
 * silently orphaned or dragged down with the booking.
 */
export async function deleteBookingAction(bookingId: string): Promise<BookingActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  if (await bookingHasPayments(bookingId)) {
    return {
      error:
        'This booking has payment records on file and can’t be permanently deleted. Archive it instead, or contact support if it truly needs to be removed.',
    }
  }

  const imagePaths = await getBookingReferenceImagePaths(bookingId)

  const supabase = await createClient()
  const { error } = await supabase.from('bookings').delete().eq('id', bookingId)

  if (error) {
    console.error('[staff/bookings] delete failed:', error)
    return { error: 'Something went wrong deleting this booking. Please try again.' }
  }

  await deleteReferenceImages(imagePaths)

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return {}
}

export async function bulkArchiveBookingsAction(bookingIds: string[]): Promise<BulkBookingActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0, skipped: [] }
  if (bookingIds.length === 0) return { succeeded: 0, skipped: [] }

  const artist = await getCurrentStaffArtist()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .update({ archived_at: new Date().toISOString(), archived_by: artist?.id ?? null })
    .in('id', bookingIds)
    .is('archived_at', null)
    .select('id')

  if (error) {
    console.error('[staff/bookings] bulk archive failed:', error)
    return { error: 'Something went wrong archiving these bookings. Please try again.', succeeded: 0, skipped: [] }
  }

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return { succeeded: data?.length ?? 0, skipped: [] }
}

export async function bulkRestoreBookingsAction(bookingIds: string[]): Promise<BulkBookingActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0, skipped: [] }
  if (bookingIds.length === 0) return { succeeded: 0, skipped: [] }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .update({ archived_at: null, archived_by: null })
    .in('id', bookingIds)
    .select('id')

  if (error) {
    console.error('[staff/bookings] bulk restore failed:', error)
    return { error: 'Something went wrong restoring these bookings. Please try again.', succeeded: 0, skipped: [] }
  }

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return { succeeded: data?.length ?? 0, skipped: [] }
}

/** Deletes every selected booking that has no payments on file; each one that does is skipped and reported back rather than failing the whole batch. */
export async function bulkDeleteBookingsAction(bookingIds: string[]): Promise<BulkBookingActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error, succeeded: 0, skipped: [] }
  if (bookingIds.length === 0) return { succeeded: 0, skipped: [] }

  const skipped: { id: string; reason: string }[] = []
  const deletable: string[] = []

  for (const id of bookingIds) {
    if (await bookingHasPayments(id)) {
      skipped.push({ id, reason: 'has payment records' })
    } else {
      deletable.push(id)
    }
  }

  if (deletable.length === 0) {
    return { succeeded: 0, skipped }
  }

  const imagePathsByBooking = await Promise.all(deletable.map((id) => getBookingReferenceImagePaths(id)))
  const allImagePaths = imagePathsByBooking.flat()

  const supabase = await createClient()
  const { data, error } = await supabase.from('bookings').delete().in('id', deletable).select('id')

  if (error) {
    console.error('[staff/bookings] bulk delete failed:', error)
    return { error: 'Something went wrong deleting these bookings. Please try again.', succeeded: 0, skipped: [] }
  }

  await deleteReferenceImages(allImagePaths)

  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')
  return { succeeded: data?.length ?? 0, skipped }
}
