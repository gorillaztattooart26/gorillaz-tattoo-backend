import type { Metadata } from 'next'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'

export const metadata: Metadata = {
  title: 'Dashboard | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function StaffDashboardPage() {
  return (
    <PlaceholderSection
      title="Dashboard"
      description="An overview of inquiries, bookings, and payments is coming soon."
    />
  )
}
