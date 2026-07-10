import type { Booking, Customer, TimelineStep } from '@/types/booking-portal'
import type { Artist } from '@/types/artist'

/**
 * Mock booking "database." `getBookingByToken` stands in for the future
 * Supabase query — same signature, so swapping the implementation later
 * (validate token, check expiry/revocation, fetch the row) requires no
 * changes in any calling code, just this function's body.
 *
 * Backed by `globalThis` rather than a plain module-level array: Next.js's
 * dev server can give different route bundles (e.g. the staff form's
 * server action vs. the [token] page) their own separate instance of this
 * module, so a plain `const` array wouldn't be shared between them. A
 * `globalThis` value is guaranteed to be the same object across module
 * instances within one Node process — the same pattern Next.js's own
 * docs recommend for singletons (e.g. a Prisma client) that need to
 * survive Fast Refresh. This whole file (and the pattern) goes away once
 * bookings are read from/written to Supabase instead.
 */
declare global {
  var __mockBookingsStore__: Booking[] | undefined
}

const SEED_BOOKINGS: Booking[] = [
  {
    token: '7b9f2d1e-4a8c-4d55-9f91-3c8e7f5a2d14',
    bookingId: 'GTA-8FK29JX',
    status: 'awaiting_down_payment',
    customer: {
      name: 'Jasmine Cruz',
      email: 'jasmine.cruz@example.com',
      mobile: '+63 917 123 4567',
      preferredContactMethod: 'email',
    },
    artist: {
      slug: 'andrea-santos',
      src: '/images/artists/artist-1.jpg',
      name: 'andrea santos',
      specialty: 'fine line & script',
      years: '8 yrs',
      bio: 'andrea found tattooing through hand-poke work before moving to machine fine line. every piece favors negative space over noise — delicate linework built to age well.',
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
      alt: 'andrea santos — fine line and script tattoo artist at gorillaz tattoo art studio philippines',
    },
    tattoo: {
      description:
        'A fine line botanical sleeve wrapping the left forearm, featuring native Philippine flora woven together with subtle negative-space linework.',
      style: 'fine line',
      placement: 'left forearm',
      estimatedSize: 'large (8–12 in)',
      estimatedSessionHours: 4,
      estimatedSessionCount: 2,
      referenceImages: [
        { src: '/images/portfolio/portfolio-3.jpg', alt: 'fine line grayswash arm sleeve reference' },
        { src: '/images/portfolio/portfolio-5.jpg', alt: 'monochrome botanical study reference' },
        { src: '/images/portfolio/portfolio-4.jpg', alt: 'fine line script placement reference' },
      ],
    },
    appointment: {
      studioAddress: 'Unit 4B, Poblacion Arts District, Makati City, Metro Manila, Philippines',
      date: '2026-08-14',
      time: '2:00 PM',
      consultationMethod: 'In-person consultation completed at the studio',
      mapUrl: 'https://maps.google.com/?q=Poblacion+Makati+City+Philippines',
      directionsUrl: 'https://maps.google.com/dir/?api=1&destination=Poblacion+Makati+City+Philippines',
    },
    invoice: {
      currency: 'PHP',
      estimatedPrice: 25000,
      downPaymentPercent: 20,
      downPaymentAmount: 5000,
      remainingBalance: 20000,
    },
    payment: null,
    timeline: [
      {
        key: 'consultation_completed',
        label: 'Consultation Completed',
        description: 'You met with Andrea to talk through the design, placement, and sizing.',
        status: 'complete',
        date: '2026-06-28',
      },
      {
        key: 'tattoo_approved',
        label: 'Tattoo Approved',
        description: 'Your final design and quote were approved by the studio.',
        status: 'complete',
        date: '2026-07-02',
      },
      {
        key: 'awaiting_down_payment',
        label: 'Awaiting Down Payment',
        description: 'Reserve your appointment by completing the required down payment.',
        status: 'current',
        date: null,
      },
      {
        key: 'appointment_confirmed',
        label: 'Appointment Confirmed',
        description: 'Your session slot is locked in once the down payment clears.',
        status: 'upcoming',
        date: null,
      },
      {
        key: 'tattoo_session',
        label: 'Tattoo Session',
        description: 'Time to get inked.',
        status: 'upcoming',
        date: '2026-08-14',
      },
    ],
    createdAt: '2026-07-02T10:00:00.000Z',
  },
]

function getStore(): Booking[] {
  if (!globalThis.__mockBookingsStore__) {
    globalThis.__mockBookingsStore__ = SEED_BOOKINGS
  }
  return globalThis.__mockBookingsStore__
}

export function getBookingByToken(token: string): Booking | null {
  return getStore().find((booking) => booking.token === token) ?? null
}

export interface CreateBookingInput {
  customer: Customer
  artist: Artist
  tattooDescription: string
  tattooStyle: string
  placement: string
  estimatedSize: string
  estimatedSessionHours: number
  estimatedSessionCount: number
  referenceImages: { src: string; alt: string }[]
  studioAddress: string
  appointmentDate: string
  appointmentTime: string
  consultationMethod: string
  estimatedPrice: number
  downPaymentPercent: number
}

/** Unambiguous alphabet (no 0/O/1/I) for human-typed reference codes. */
const BOOKING_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateBookingId(): string {
  let suffix = ''
  for (let i = 0; i < 7; i++) {
    suffix += BOOKING_ID_ALPHABET[Math.floor(Math.random() * BOOKING_ID_ALPHABET.length)]
  }
  return `GTA-${suffix}`
}

function buildDefaultTimeline(appointmentDate: string): TimelineStep[] {
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      key: 'consultation_completed',
      label: 'Consultation Completed',
      description: 'The consultation with the artist has been completed.',
      status: 'complete',
      date: today,
    },
    {
      key: 'tattoo_approved',
      label: 'Tattoo Approved',
      description: 'The final design and quote were approved by the studio.',
      status: 'complete',
      date: today,
    },
    {
      key: 'awaiting_down_payment',
      label: 'Awaiting Down Payment',
      description: 'Reserve your appointment by completing the required down payment.',
      status: 'current',
      date: null,
    },
    {
      key: 'appointment_confirmed',
      label: 'Appointment Confirmed',
      description: 'Your session slot is locked in once the down payment clears.',
      status: 'upcoming',
      date: null,
    },
    {
      key: 'tattoo_session',
      label: 'Tattoo Session',
      description: 'Time to get inked.',
      status: 'upcoming',
      date: appointmentDate,
    },
  ]
}

/**
 * Creates a new booking and adds it to the in-memory mock store — this is
 * the seam a future Supabase `insert()` replaces. `crypto.randomUUID()`
 * stands in for however Supabase/the backend generates the opaque route
 * token later; the shape and caller contract won't need to change.
 */
export function createMockBooking(input: CreateBookingInput): Booking {
  const downPaymentAmount = Math.round(
    input.estimatedPrice * (input.downPaymentPercent / 100),
  )

  const booking: Booking = {
    token: crypto.randomUUID(),
    bookingId: generateBookingId(),
    status: 'awaiting_down_payment',
    customer: input.customer,
    artist: input.artist,
    tattoo: {
      description: input.tattooDescription,
      style: input.tattooStyle,
      placement: input.placement,
      estimatedSize: input.estimatedSize,
      estimatedSessionHours: input.estimatedSessionHours,
      estimatedSessionCount: input.estimatedSessionCount,
      referenceImages: input.referenceImages,
    },
    appointment: {
      studioAddress: input.studioAddress,
      date: input.appointmentDate,
      time: input.appointmentTime,
      consultationMethod: input.consultationMethod,
      mapUrl: `https://maps.google.com/?q=${encodeURIComponent(input.studioAddress)}`,
      directionsUrl: `https://maps.google.com/dir/?api=1&destination=${encodeURIComponent(input.studioAddress)}`,
    },
    invoice: {
      currency: 'PHP',
      estimatedPrice: input.estimatedPrice,
      downPaymentPercent: input.downPaymentPercent,
      downPaymentAmount,
      remainingBalance: input.estimatedPrice - downPaymentAmount,
    },
    payment: null,
    timeline: buildDefaultTimeline(input.appointmentDate),
    createdAt: new Date().toISOString(),
  }

  getStore().push(booking)
  return booking
}
