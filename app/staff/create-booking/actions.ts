'use server'

import { supabase } from '@/lib/supabase'
import { createBookingSchema, type CreateBookingValues } from '@/app/staff/create-booking/schema'
import { getBaseUrl } from '@/lib/url'
import { sendBookingConfirmationEmail } from '@/lib/emails'

const DEFAULT_REFERENCE_IMAGES = [
  { path: '/images/portfolio/portfolio-1.jpg', alt: 'Reference image on file for this booking' },
  { path: '/images/portfolio/portfolio-3.jpg', alt: 'Reference image on file for this booking' },
]

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
  token: string
  bookingId: string
}

/**
 * Server Action backing the staff "Create a Booking" form. Re-validates
 * server-side (never trust client input), looks up the artist row, then
 * inserts the booking.
 *
 * `id`/`token`/`booking_id` are generated here rather than read back via
 * `.select()` after insert — `bookings` deliberately has no SELECT policy
 * for the anon role, and Postgres RLS requires the SELECT policy to also
 * pass for `INSERT ... RETURNING` to hand back a row, so relying on
 * `.select()` wouldn't work. Same pattern as the inquiry form's
 * `inquiryId` in components/booking/actions.ts.
 *
 * Reference images aren't actually uploaded/stored anywhere yet (no
 * upload UI is wired to storage), so newly created bookings get a couple
 * of sample images so the resulting /booking/[token] page has something
 * to show in its gallery — swap this for real uploaded files once that's
 * connected.
 */
export async function createBookingAction(
  values: CreateBookingValues,
): Promise<CreateBookingActionResult> {
  const parsed = createBookingSchema.parse(values)

  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('id, name')
    .eq('slug', parsed.artistSlug)
    .maybeSingle()

  if (artistError || !artist) {
    throw new Error(`Unknown artist: ${parsed.artistSlug}`)
  }

  const id = crypto.randomUUID()
  const token = crypto.randomUUID()
  const bookingId = generateBookingId()
  const downPaymentAmount = Math.round(parsed.estimatedPrice * (parsed.downPaymentPercent / 100))

  const { error: insertError } = await supabase.from('bookings').insert({
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

  for (const image of DEFAULT_REFERENCE_IMAGES) {
    const { error: imageInsertError } = await supabase.from('booking_reference_images').insert({
      booking_id: id,
      image_path: image.path,
      alt_text: image.alt,
    })

    if (imageInsertError) {
      console.error('[bookings] booking_reference_images insert failed:', imageInsertError)
    }
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

  return { token, bookingId }
}
