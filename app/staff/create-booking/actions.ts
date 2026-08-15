'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { createBookingSchema, type CreateBookingValues } from '@/app/staff/create-booking/schema'
import { getBaseUrl } from '@/lib/url'
import { sendBookingConfirmationEmail } from '@/lib/emails'
import { checkArtistConflict } from '@/lib/staff/booking-availability'
import { manilaDateTimeToUtcInterval } from '@/lib/staff/timezone'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

/** Unambiguous alphabet (no 0/O/1/I) for human-typed reference codes. */
const BOOKING_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateBookingId(): string {
  let suffix = ''
  for (let i = 0; i < 7; i++) {
    suffix += BOOKING_ID_ALPHABET[Math.floor(Math.random() * BOOKING_ID_ALPHABET.length)]
  }
  return `GTA-${suffix}`
}

export interface CreateBookingActionResult {
  token?: string
  bookingId?: string
  error?: string
}

/**
 * Server Action backing the staff "Create a Booking" form. Re-validates
 * server-side (never trust client input), looks up the artist row, then
 * inserts the booking.
 *
 * The booking insert runs on the staff session client (`sessionSupabase`,
 * `authenticated` role) — this action only ever runs behind
 * /staff/create-booking's auth gate, so the write should carry the
 * caller's real role rather than the anon key. `bookings` has no SELECT
 * policy for `authenticated` beyond what the Bookings tab already relies
 * on, and Postgres RLS requires the SELECT policy to also pass for
 * `INSERT ... RETURNING` to hand back a row, so `id`/`token`/`booking_id`
 * are generated here rather than read back via `.select()` — same pattern
 * as the inquiry form's `inquiryId` in components/booking/actions.ts,
 * which has the equivalent constraint under `anon`.
 *
 * The reference-image insert below runs on the service-role client
 * instead, narrowly scoped to the single booking `id` generated in this
 * same call — see the comment at that insert and lib/supabase-admin.ts
 * for why (this flow can create a booking for any artist, not just the
 * caller's own, and RLS on booking_reference_images is scoped per-artist).
 *
 * Does not attach any reference images — this is an internal, staff-only
 * booking created after the customer's consultation and design have
 * already been reviewed in person, so the private booking confirmation
 * page has no need to re-display reference photos (see TattooDetails.tsx).
 * The original inquiry's photos, if any, remain fully intact and visible
 * to staff in the Inquiries tab regardless.
 *
 * Explicitly checks for a logged-in staff account before doing anything
 * else — this is the one write in the staff area that previously relied
 * entirely on the /staff/create-booking middleware gate and the
 * `bookings` INSERT RLS policy (authenticated-only, see migration
 * 20260808150000) rather than also checking in code, unlike every other
 * privileged Server Action in the app (see e.g. updateArtistProfileAction,
 * createGalleryItemAction). Same `getCurrentStaffArtist()` helper those
 * use, not a new check.
 */
export async function createBookingAction(values: CreateBookingValues): Promise<CreateBookingActionResult> {
  const staffArtist = await getCurrentStaffArtist()
  if (!staffArtist) {
    return { error: "Your account isn't linked to an artist yet — ask the studio owner to link it." }
  }

  const parsed = createBookingSchema.parse(values)

  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, name')
    .eq('slug', parsed.artistSlug)
    .maybeSingle()

  if (artistError || !artist) {
    throw new Error(`Unknown artist: ${parsed.artistSlug}`)
  }

  // Best-effort double-booking + availability-block guard — uses the
  // staff session client (authenticated already has EXECUTE on the
  // check_artist_booking_conflict RPC) rather than the anon client above,
  // which has no read access to bookings/availability at all. Goes
  // through the RPC rather than a direct table query specifically so
  // this also works when staff create a booking for an artist other than
  // themselves (the front-desk flow this action already supports below)
  // — see checkArtistConflict's doc comment for why a direct query can't
  // do that under RLS. Any read failure here just skips the check rather
  // than blocking booking creation, matching the prior convention.
  const sessionSupabase = await createClient()
  const { startsAt, endsAt } = manilaDateTimeToUtcInterval(
    parsed.appointmentDate,
    parsed.appointmentTime,
    parsed.estimatedSessionHours,
  )
  const conflict = await checkArtistConflict(sessionSupabase, {
    artistId: artist.id,
    startsAt,
    endsAt,
  })

  if (conflict.hasConflict) {
    return {
      error:
        conflict.conflictType === 'availability_block'
          ? `${artist.name} is marked unavailable during this time. Pick a different time or check the Availability tab.`
          : `${artist.name} already has a booking that overlaps this time slot. Pick a different time or check the Bookings tab.`,
    }
  }

  const id = crypto.randomUUID()
  const token = crypto.randomUUID()
  const bookingId = generateBookingId()
  const downPaymentAmount = Math.round(parsed.estimatedPrice * (parsed.downPaymentPercent / 100))

  const { error: insertError } = await sessionSupabase.from('bookings').insert({
    id,
    token,
    booking_id: bookingId,
    status: 'awaiting_down_payment',
    customer_name: parsed.customerName,
    customer_email: parsed.customerEmail,
    customer_mobile: parsed.customerMobile,
    preferred_contact_method: parsed.preferredContactMethod,
    artist_id: artist.id,
    tattoo_description: parsed.tattooDescription,
    tattoo_style: parsed.tattooStyle,
    placement: parsed.placement,
    estimated_size: parsed.estimatedSize,
    estimated_session_hours: parsed.estimatedSessionHours,
    estimated_session_count: parsed.estimatedSessionCount,
    studio_address: parsed.studioAddress,
    appointment_date: parsed.appointmentDate,
    appointment_time: parsed.appointmentTime,
    consultation_method: parsed.consultationMethod,
    currency: 'PHP',
    estimated_price: parsed.estimatedPrice,
    down_payment_percent: parsed.downPaymentPercent,
    down_payment_amount: downPaymentAmount,
    remaining_balance: parsed.estimatedPrice - downPaymentAmount,
  })

  if (insertError) {
    console.error('[bookings] insert failed:', insertError)
    throw new Error('Something went wrong creating this booking.')
  }

  const baseUrl = await getBaseUrl()
  await sendBookingConfirmationEmail({
    to: parsed.customerEmail,
    customerName: parsed.customerName,
    bookingId,
    bookingUrl: `${baseUrl}/booking/${token}`,
    artistName: artist.name,
    appointmentDate: parsed.appointmentDate,
    appointmentTime: parsed.appointmentTime,
  })

  // Staff are redirected straight to the customer-facing /booking/[token]
  // page after creating a booking (to hand off the link), not back to the
  // Bookings tab — without this, the next visit to /staff/bookings within
  // Next's client Router Cache window could still serve the pre-creation
  // list. Matches the revalidatePath calls every other bookings-mutating
  // action already makes (app/staff/(protected)/bookings/actions.ts).
  revalidatePath('/staff/bookings')
  revalidatePath('/staff/dashboard')

  return { token, bookingId }
}
