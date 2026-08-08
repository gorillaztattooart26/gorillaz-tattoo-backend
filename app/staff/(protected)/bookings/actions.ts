'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { checkBookingConflict } from '@/lib/staff/booking-availability'
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
      'id, token, booking_id, status, customer_name, customer_email, artist_id, appointment_date, appointment_time, estimated_session_hours, artists(name)',
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
