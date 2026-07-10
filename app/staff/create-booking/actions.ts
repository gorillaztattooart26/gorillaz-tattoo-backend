'use server'

import { createMockBooking } from '@/lib/mock/bookings'
import { getArtistBySlug } from '@/lib/mock/artists'
import { createBookingSchema, type CreateBookingValues } from '@/app/staff/create-booking/schema'

const DEFAULT_REFERENCE_IMAGES = [
  { src: '/images/portfolio/portfolio-1.jpg', alt: 'Reference image on file for this booking' },
  { src: '/images/portfolio/portfolio-3.jpg', alt: 'Reference image on file for this booking' },
]

export interface CreateBookingActionResult {
  token: string
  bookingId: string
}

/**
 * Server Action — the seam a future Supabase `insert()` replaces. The
 * client form validates with the same Zod schema before calling this, so
 * this re-validates server-side (never trust client input) and then
 * mutates the in-memory mock store via createMockBooking().
 *
 * Reference images aren't actually uploaded/stored anywhere yet (no
 * storage backend is wired up), so newly created bookings get a couple
 * of sample images so the resulting /booking/[token] page has something
 * to show in its gallery — swap this for real uploaded URLs once file
 * storage exists.
 */
export async function createBookingAction(
  values: CreateBookingValues,
): Promise<CreateBookingActionResult> {
  const parsed = createBookingSchema.parse(values)

  const artist = getArtistBySlug(parsed.artistSlug)
  if (!artist) {
    throw new Error(`Unknown artist: ${parsed.artistSlug}`)
  }

  const booking = createMockBooking({
    customer: {
      name: parsed.customerName,
      email: parsed.customerEmail,
      mobile: parsed.customerMobile,
      preferredContactMethod: parsed.preferredContactMethod,
    },
    artist,
    tattooDescription: parsed.tattooDescription,
    tattooStyle: parsed.tattooStyle,
    placement: parsed.placement,
    estimatedSize: parsed.estimatedSize,
    estimatedSessionHours: parsed.estimatedSessionHours,
    estimatedSessionCount: parsed.estimatedSessionCount,
    referenceImages: DEFAULT_REFERENCE_IMAGES,
    studioAddress: parsed.studioAddress,
    appointmentDate: parsed.appointmentDate,
    appointmentTime: parsed.appointmentTime,
    consultationMethod: parsed.consultationMethod,
    estimatedPrice: parsed.estimatedPrice,
    downPaymentPercent: parsed.downPaymentPercent,
  })

  return { token: booking.token, bookingId: booking.bookingId }
}
