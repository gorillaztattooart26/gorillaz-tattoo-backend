'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { createBookingSchema, type CreateBookingValues } from '@/app/staff/create-booking/schema'
import { getBaseUrl } from '@/lib/url'
import { sendBookingConfirmationEmail } from '@/lib/emails'
import { checkBookingConflict } from '@/lib/staff/booking-availability'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import type { Database } from '@/types/supabase'

const DEFAULT_REFERENCE_IMAGES = [
  { path: '/images/portfolio/portfolio-1.jpg', alt: 'Reference image on file for this booking' },
  { path: '/images/portfolio/portfolio-3.jpg', alt: 'Reference image on file for this booking' },
]

const REFERENCES_BUCKET = 'references'
// Reuses the existing public `homepage-media` bucket (already staff-
// writable, see supabase-setup-homepage-media.sql) under its own prefix,
// rather than standing up a dedicated bucket just for this — booking
// reference photos need a durable public URL the same way homepage media
// does, and `booking_reference_images.image_path` already just expects a
// plain browsable URL (see DEFAULT_REFERENCE_IMAGES above).
const CARRYOVER_BUCKET = 'homepage-media'

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
 * Downloads each of an inquiry's reference photos from the private
 * `references` bucket and re-uploads them to the public `homepage-media`
 * bucket so the resulting booking has a durable, directly-browsable URL
 * for its gallery — a signed URL from the private bucket would expire
 * long before the booking's appointment date.
 *
 * Uses the staff session client — reading the private bucket and writing
 * to homepage-media both require the `authenticated` role, which this
 * Server Action only has because /staff/create-booking is auth-gated by
 * middleware. Best-effort: any failure here just falls back to the sample
 * images below rather than blocking booking creation.
 */
async function copyInquiryReferenceImages(
  sessionSupabase: SupabaseClient<Database>,
  inquiryId: string,
  bookingId: string,
): Promise<{ path: string; alt: string }[]> {
  const { data: images, error } = await sessionSupabase
    .from('inquiry_images')
    .select('image_path')
    .eq('inquiry_id', inquiryId)

  if (error || !images || images.length === 0) {
    if (error) console.error('[bookings] fetching inquiry images for carryover failed:', error)
    return []
  }

  const copied: { path: string; alt: string }[] = []

  for (const { image_path } of images) {
    const { data: file, error: downloadError } = await sessionSupabase.storage
      .from(REFERENCES_BUCKET)
      .download(image_path)

    if (downloadError || !file) {
      console.error('[bookings] downloading inquiry reference image failed:', downloadError)
      continue
    }

    const filename = image_path.split('/').pop() ?? `${crypto.randomUUID()}.jpg`
    const newPath = `booking-references/${bookingId}/${crypto.randomUUID()}-${filename}`

    const { error: uploadError } = await sessionSupabase.storage
      .from(CARRYOVER_BUCKET)
      .upload(newPath, file, { contentType: file.type || 'image/jpeg' })

    if (uploadError) {
      console.error('[bookings] uploading carried-over reference image failed:', uploadError)
      continue
    }

    const { data: publicUrl } = sessionSupabase.storage.from(CARRYOVER_BUCKET).getPublicUrl(newPath)
    copied.push({ path: publicUrl.publicUrl, alt: 'Reference photo from customer inquiry' })
  }

  return copied
}

/**
 * Server Action backing the staff "Create a Booking" form. Re-validates
 * server-side (never trust client input), looks up the artist row, then
 * inserts the booking.
 *
 * The booking and reference-image inserts run on the staff session client
 * (`sessionSupabase`, `authenticated` role) — this action only ever runs
 * behind /staff/create-booking's auth gate, so the write should carry the
 * caller's real role rather than the anon key. `bookings` has no SELECT
 * policy for `authenticated` beyond what the Bookings tab already relies
 * on, and Postgres RLS requires the SELECT policy to also pass for
 * `INSERT ... RETURNING` to hand back a row, so `id`/`token`/`booking_id`
 * are generated here rather than read back via `.select()` — same pattern
 * as the inquiry form's `inquiryId` in components/booking/actions.ts,
 * which has the equivalent constraint under `anon`.
 *
 * Reference images fall back to a couple of sample photos when there's
 * no source inquiry (or it had none of its own) — real upload UI still
 * isn't wired to storage for a from-scratch booking.
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

  // Best-effort double-booking guard — uses the staff session client
  // (authenticated already has SELECT on bookings, proven by the
  // Bookings tab) rather than the anon client above, which has no read
  // access to this table at all. Any read failure here just skips the
  // check rather than blocking booking creation.
  const sessionSupabase = await createClient()
  const conflict = await checkBookingConflict(sessionSupabase, {
    artistId: artist.id,
    date: parsed.appointmentDate,
    time: parsed.appointmentTime,
    durationHours: parsed.estimatedSessionHours,
  })

  if (conflict.hasConflict) {
    return {
      error: `${artist.name} already has a booking (${conflict.conflictingBookingRef}) that overlaps this time slot. Pick a different time or check the Bookings tab.`,
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

  const carriedOverImages = parsed.sourceInquiryId
    ? await copyInquiryReferenceImages(sessionSupabase, parsed.sourceInquiryId, id)
    : []
  const referenceImages = carriedOverImages.length > 0 ? carriedOverImages : DEFAULT_REFERENCE_IMAGES

  for (const image of referenceImages) {
    const { error: imageInsertError } = await sessionSupabase.from('booking_reference_images').insert({
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
