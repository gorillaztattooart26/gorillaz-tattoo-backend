import type { Metadata } from 'next'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Bookings | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffBookingsPage() {
  return (
    <PlaceholderSection
      title="Bookings"
      description="Managing bookings from this dashboard is coming soon. Use Create Booking for now."
    />
  )
}
