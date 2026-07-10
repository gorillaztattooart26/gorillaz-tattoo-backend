import type { Booking } from '@/types/booking-portal'

/**
 * Mock booking "database." `getBookingByToken` stands in for the future
 * Supabase query — same signature, so swapping the implementation later
 * (validate token, check expiry/revocation, fetch the row) requires no
 * changes in any calling code, just this function's body.
 */
const MOCK_BOOKINGS: Booking[] = [
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

export function getBookingByToken(token: string): Booking | null {
  return MOCK_BOOKINGS.find((booking) => booking.token === token) ?? null
}
