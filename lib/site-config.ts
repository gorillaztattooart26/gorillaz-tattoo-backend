export const siteConfig = {
  name: 'gorillaz tattoo art',
  title: 'gorillaz tattoo art — custom ink design & tattoo portfolio',
  description:
    'gorillaz tattoo art — custom ink design studio. fine lines, bold blackwork, and permanent self-expression. book a tattoo session with our award-winning artists.',
  keywords: [
    'tattoo portfolio',
    'custom ink design',
    'gorillaz tattoo art studio',
    'blackwork tattoo',
    'fine line tattoo',
    'custom tattoo design',
  ],
  url: 'https://gorillaztattooart.com',
  email: 'bookings@gorillaztattooart.com',
  locale: 'en_US',
  themeColor: '#fabb42',
  social: {
    facebook: 'https://www.facebook.com/GorillazTattooArt',
    instagram: 'https://www.instagram.com/gorillaztattooart/?hl=en',
  },
  // Address sourced from the staff Create Booking form's own default
  // studio address (components/staff/CreateBookingForm.tsx) — the same
  // address already put on every booking's appointment details, so it's
  // treated as confirmed. Hours sourced from the customer-facing booking
  // portal footer (components/booking/BookingFooter.tsx), shown to every
  // customer today. Phone is still genuinely unconfirmed, so it stays
  // null rather than publishing a placeholder number in SEO structured
  // data.
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Blk 8 Lot 18 Sutter Street, Phase 5, 3 Garden Villas Subdivision',
    addressLocality: 'Santa Rosa',
    addressRegion: 'Laguna',
    addressCountry: 'PH',
  },
  phone: null,
  openingHours: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:00',
      closes: '20:00',
    },
  ],
} as const
