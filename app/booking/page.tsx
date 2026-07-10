import type { Metadata } from 'next'
import { Booking } from '@/components/sections/Booking'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Book a Session',
  description:
    'Send gorillaz tattoo art your idea — full name, preferred artist, style, placement, size, and a target date. We reply within 48 hours.',
  path: ROUTES.booking,
})

/**
 * The inquiry form already exists in full (unlike about/artists/portfolio,
 * which need new content not yet written), so this route reuses the real
 * Booking section rather than showing a placeholder.
 */
export default function BookingPage() {
  return (
    <>
      <div className="bg-black px-6 pt-28 md:px-10 md:pt-32">
        <Breadcrumbs
          entries={[
            { name: 'Home', path: ROUTES.home },
            { name: 'Booking', path: ROUTES.booking },
          ]}
        />
      </div>
      <Booking />
    </>
  )
}
